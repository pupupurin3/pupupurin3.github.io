import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSiteEvent } from '../../hooks/useSiteEvent'
import type { ShowToast } from '../../hooks/useToast'
import { api, apiEnabled } from '../../lib/api'
import { emit } from '../../lib/events'
import { isModalOpen, isTyping } from '../../lib/platform'
import { readStorage, writeStorage } from '../../lib/storage'
import { scanPlatforms, scanStars, STARS } from './level'
import { BUFFER, newPlayer, stepPlayer, type Input, type Platform } from './physics'
import { burst, drawParticles, drawPrompt, drawStar, formatTime, type Particle } from './render'
import { purinSprite, SPRITE_H as H, SPRITE_W as W } from './sprite'
import { Leaderboard, PostTime } from './Leaderboard'

// An optional platformer played on top of the real page. Purin runs and jumps
// on the site's own headings, buttons and cards (their top edges become
// one-way platforms), collects stars spread through the sections and can
// open a project by standing on its card. The canvas never takes pointer
// events, so the page stays fully clickable and scrollable while playing.

const BEST_KEY = 'purin-best'
const loadBest = () => Number(readStorage(BEST_KEY)) || 0

const KEYS: Record<string, keyof Input> = {
  ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
  ArrowUp: 'jump', w: 'jump', ' ': 'jump', ArrowDown: 'down', s: 'down',
}

interface Controls {
  respawn: () => void
  press: (action: keyof Input) => void
}

export function PlayLayer({ show, onToast }: { show: boolean; onToast: ShowToast }) {
  const [playing, setPlaying] = useState(false)
  const [touch, setTouch] = useState(false)
  /** Set when every star is collected and the run can go on the leaderboard. */
  const [finishedRun, setFinishedRun] = useState<string | null>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const hud = useRef<HTMLSpanElement>(null)
  const input = useRef<Input>({ left: false, right: false, jump: false, down: false })
  const game = useRef<Controls | null>(null)
  /** Server-side run id, so the leaderboard can time the run itself. */
  const runId = useRef<Promise<string | null> | null>(null)

  const toggle = useCallback(() => setPlaying((p) => !p), [])
  useSiteEvent('toggle-game', toggle)
  useEffect(() => setTouch(window.matchMedia('(pointer: coarse)').matches), [])

  // Keyboard: P toggles, Esc quits, R respawns. Arrow keys and space are only
  // captured while playing and nothing else wants them.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      const down = e.type === 'keydown'
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (down && k === 'p' && !isModalOpen()) return toggle()
      if (!playing) return
      if (down && k === 'Escape' && !isModalOpen()) return setPlaying(false)
      if (down && k === 'r') return game.current?.respawn()
      const action = KEYS[k]
      if (!action || isModalOpen()) return
      e.preventDefault()
      if (down && !input.current[action]) game.current?.press(action)
      input.current[action] = down
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  }, [playing, toggle])

  useEffect(() => {
    if (!playing) return undefined
    const keys = input.current
    setFinishedRun(null)
    // Start the server's clock alongside ours. If the API is down the game
    // plays exactly the same, there's just no leaderboard entry.
    runId.current = apiEnabled ? api.startRun().then((r) => r.runId, () => null) : Promise.resolve(null)

    const cv = canvas.current!
    const ctx = cv.getContext('2d')!
    const img = purinSprite()
    // On phones the touch pad covers the bottom of the screen, so keep Purin higher.
    const low = window.matchMedia('(pointer: coarse)').matches ? 0.5 : 0.7
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      cv.width = window.innerWidth * dpr
      cv.height = window.innerHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    let platforms = scanPlatforms()
    let stars = scanStars()
    const got = new Set<number>()
    let lastScan = 0
    const p = newPlayer(0, 0)
    const dust: Particle[] = []
    const confetti: Particle[] = []
    let time = 0
    let won = false
    let best = loadBest()

    const respawn = () => {
      const h1 = document.querySelector('#home h1')?.getBoundingClientRect()
      const onScreen = h1 && h1.bottom > 0 && h1.top < window.innerHeight
      p.x = onScreen ? h1.left + 10 : window.innerWidth * 0.2
      p.y = window.scrollY + (onScreen ? h1.top - 140 : 90)
      p.vx = 0
      p.vy = 0
      p.on = null
    }
    respawn()

    game.current = {
      respawn,
      press(action) {
        if (action === 'jump') p.buffer = BUFFER
        if (action === 'down' && p.on) {
          const card = p.on.el.closest<HTMLElement>('.card')
          if (card?.dataset.project) {
            input.current.down = false
            emit('open-project', card.dataset.project)
          } else p.drop = 0.25
        }
        // If the page was scrolled away from Purin, bring Purin to the view.
        const sy = p.y - window.scrollY
        if (sy < -H * 2 || sy > window.innerHeight + H) {
          p.x = Math.min(p.x, window.innerWidth - W)
          p.y = window.scrollY + 80
          p.vy = 0
          p.on = null
        }
      },
    }

    let last = performance.now()
    let raf = 0
    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      if (isModalOpen()) {
        Object.keys(input.current).forEach((k) => (input.current[k as keyof Input] = false))
        return
      }

      if (now - lastScan > 220) {
        platforms = scanPlatforms()
        stars = scanStars()
        lastScan = now
      }
      const vw = window.innerWidth
      const vh = window.innerHeight
      const sy = window.scrollY
      const floor: Platform = { key: 'floor', el: document.body, x1: 0, x2: vw, y: document.documentElement.scrollHeight - 2 }

      if (!won) time += dt
      const landing = stepPlayer(p, input.current, { platforms, width: vw, floor }, dt)
      if (landing?.hard) burst(dust, landing.x, landing.y, 6, ['rgba(255,255,255,0.5)'])

      // Stars.
      stars.forEach((s, n) => {
        if (!s || got.has(n)) return
        if (Math.abs(p.x + W / 2 - s.x) < 26 && Math.abs(p.y + H / 2 - s.y) < 30) {
          got.add(n)
          burst(dust, s.x, s.y, 14, ['#ffd76a', '#8ab4ff', '#ffffff'])
          if (got.size === STARS.length && !won) {
            won = true
            burst(confetti, vw / 2, sy + 40, 120, ['#8ab4ff', '#ffd76a', '#ff9aa8', '#7be0b0', '#ffffff'])
            const record = !best || time < best
            if (record) {
              best = time
              writeStorage(BEST_KEY, String(time))
            }
            onToast(record ? `All stars in ${formatTime(time)}. New best!` : `All stars in ${formatTime(time)}. Best ${formatTime(best)}`)
            void runId.current?.then((id) => id && setFinishedRun(id))
          }
        }
      })

      // Standing on a project card offers to open it.
      const card = p.on?.el.closest<HTMLElement>('.card')
      const prompt = card?.dataset.project ? 'Press ↓ to open' : null

      // Camera: follow Purin only while Purin is moving, so manual scrolling
      // is never fought.
      const screenY = p.y - sy
      if (Math.abs(p.vx) > 20 || !p.on) {
        if (screenY > vh * low) window.scrollTo({ top: sy + (screenY - vh * low), behavior: 'instant' })
        else if (screenY < vh * 0.25 && screenY > -H * 3) window.scrollTo({ top: Math.max(0, sy + (screenY - vh * 0.25)), behavior: 'instant' })
      }

      // Draw.
      const oy = window.scrollY
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, vw, vh)

      const t = now / 1000
      stars.forEach((s, n) => {
        if (!s || got.has(n)) return
        const y = s.y - oy + Math.sin(t * 3 + n) * 4
        if (y < -30 || y > vh + 30) return
        drawStar(ctx, s.x, y, 9, t + n)
      })
      drawParticles(ctx, dust, dt, oy, [3, 3])
      drawParticles(ctx, confetti, dt, oy, [5, 8])

      // Purin with squash and stretch, plus a little run bob.
      const bob = p.on && Math.abs(p.vx) > 30 ? Math.abs(Math.sin(t * 16)) * 2 : 0
      const cx = p.x + W / 2
      ctx.save()
      ctx.translate(cx, p.y + H - oy - bob)
      ctx.scale((1 + p.squash) * p.face, 1 - p.squash)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, -W / 2, -H)
      ctx.restore()
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(cx - W * 0.35, p.y + H - oy + 1, W * 0.7, 2)

      if (prompt) drawPrompt(ctx, prompt, cx, p.y - oy, vw)

      if (hud.current) hud.current.textContent = `★ ${got.size}/${STARS.length}  ·  ${formatTime(time)}${best ? `  ·  best ${formatTime(best)}` : ''}`
    }
    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      Object.keys(keys).forEach((k) => (keys[k as keyof Input] = false))
      game.current = null
    }
  }, [playing, onToast])

  const hold = (action: keyof Input) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      game.current?.press(action)
      input.current[action] = true
    },
    onPointerUp: () => (input.current[action] = false),
    onPointerLeave: () => (input.current[action] = false),
    onPointerCancel: () => (input.current[action] = false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  })

  return (
    <>
      {playing && <canvas ref={canvas} className="play-canvas" aria-hidden="true" />}
      <AnimatePresence>
        {show && (
          <motion.div className="play-dock" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ delay: playing ? 0 : 1.4 }}>
            {playing ? (
              <>
                <span className="play-hud" ref={hud} aria-live="off" />
                {finishedRun ? (
                  <PostTime runId={finishedRun} stars={STARS.length} onToast={onToast} onDone={() => setFinishedRun(null)} />
                ) : (
                  !touch && (
                    <span className="play-keys">
                      <kbd>←</kbd>
                      <kbd>→</kbd> move <kbd>↑</kbd> jump <kbd>↓</kbd> drop · open
                    </span>
                  )
                )}
                {apiEnabled && <Leaderboard />}
                <button className="play-btn" onClick={() => setPlaying(false)}>
                  Quit {!touch && <kbd>Esc</kbd>}
                </button>
              </>
            ) : (
              <button className="play-btn primary" onClick={() => setPlaying(true)} aria-label="Play the portfolio game">
                <span className="play-icon" aria-hidden="true">
                  ▶
                </span>{' '}
                Play {!touch && <kbd>P</kbd>}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {playing && touch && (
        <div className="play-pad">
          <div>
            <button aria-label="Left" {...hold('left')}>
              ◀
            </button>
            <button aria-label="Right" {...hold('right')}>
              ▶
            </button>
          </div>
          <div>
            <button aria-label="Drop or open" {...hold('down')}>
              ▼
            </button>
            <button aria-label="Jump" className="jump" {...hold('jump')}>
              ▲
            </button>
          </div>
        </div>
      )}
    </>
  )
}

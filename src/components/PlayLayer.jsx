import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// An optional platformer played on top of the real page. Purin runs and jumps
// on the site's own headings, buttons and cards (their top edges become
// one-way platforms), collects stars spread through the sections and can
// open a project by standing on its card. The canvas never takes pointer
// events, so the page stays fully clickable and scrollable while playing.

// Elements whose top edge is a platform. Headings use their text lines so
// Purin stands on the words, not on the full-width block.
const SOLID = [
  '.btn', '.card', '.tilt-card', '.hero-stats', '.segmented', '.lab-tabs', '.cv-item',
  '.reorder-item', '.throw-area', '.shelf-frame', '.gallery', '.scroll-demo', '.about-person',
  '.tags span', '.section-index',
].join(',')
const TEXT = 'h1, h2, h3, .contact-title'

// Where the stars float: [selector, horizontal position 0..1 across it].
const STARS = [
  ['#home h1', 0.15],
  ['.hero-figure', 0.7],
  ['#work .section-header h2', 0.9],
  ['#work .card', 0.5],
  ['.lab-tabs', 0.85],
  ['.about-person', 0.3],
  ['.about-cv .cv-item:last-child', 0.8],
  ['.contact-title', 0.6],
]

const G = 2300
const RUN = 330
const JUMP = 830
const COYOTE = 0.1
const BUFFER = 0.12
const PX = 3

// Pixel-art Purin: c caramel, C dark caramel, y custard, Y custard shade,
// k eyes, p blush, w plate.
const SPRITE = [
  '...cccccc...',
  '..cCccccCc..',
  '..yyyyyyyy..',
  '.yyyyyyyyyy.',
  '.yykyyyykyy.',
  '.ypyyyyyypy.',
  'yyyyykkyyyyy',
  'yyyyyyyyyyyY',
  'YyyyyyyyyyYY',
  '.YYYYYYYYYY.',
  'wwwwwwwwwwww',
]
const COLORS = { c: '#8a4b1f', C: '#5e3112', y: '#ffd76a', Y: '#e8b54a', k: '#2a1a12', p: '#ff9aa8', w: '#e9ecf2' }
const W = SPRITE[0].length * PX
const H = SPRITE.length * PX

let spriteCanvas
function sprite() {
  if (spriteCanvas) return spriteCanvas
  spriteCanvas = document.createElement('canvas')
  spriteCanvas.width = W
  spriteCanvas.height = H
  const g = spriteCanvas.getContext('2d')
  SPRITE.forEach((row, y) => [...row].forEach((ch, x) => {
    if (COLORS[ch]) { g.fillStyle = COLORS[ch]; g.fillRect(x * PX, y * PX, PX, PX) }
  }))
  return spriteCanvas
}

const typing = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
const modalOpen = () => !!document.querySelector('[aria-modal="true"]')
const load = () => { try { return Number(localStorage.getItem('purin-best')) || 0 } catch { return 0 } }
const save = (t) => { try { localStorage.setItem('purin-best', String(t)) } catch { /* storage unavailable */ } }
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`

function visible(el) {
  const s = getComputedStyle(el)
  return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.2
}

// Collects every platform in document coordinates.
function scan() {
  const sy = window.scrollY
  const out = []
  const push = (r, el, key) => {
    if (r.width < 18 || r.height < 4) return
    out.push({ x1: r.left, x2: r.right, y: r.top + sy, el, key })
  }
  document.querySelectorAll(SOLID).forEach((el, i) => {
    if (el.closest('.scroll-demo') && !el.classList.contains('scroll-demo')) return
    if (el.closest('[aria-modal="true"]') || !visible(el)) return
    push(el.getBoundingClientRect(), el, `s${i}`)
  })
  const range = document.createRange()
  document.querySelectorAll(TEXT).forEach((el, i) => {
    if (el.closest('[aria-modal="true"], .card, .scroll-demo') || !visible(el)) return
    range.selectNodeContents(el)
    // Merge the per-word rects of each line into one platform.
    const lines = []
    for (const r of range.getClientRects()) {
      const line = lines.find((l) => Math.abs(l.top - r.top) < r.height * 0.5)
      if (line) { line.left = Math.min(line.left, r.left); line.right = Math.max(line.right, r.right) }
      else lines.push({ top: r.top, left: r.left, right: r.right, height: r.height })
    }
    // Text rects include the line's leading, so stand a little lower.
    lines.forEach((l, j) => push({ left: l.left, right: l.right, width: l.right - l.left, top: l.top + l.height * 0.18, height: l.height }, el, `t${i}-${j}`))
  })
  return out
}

function scanStars() {
  const sy = window.scrollY
  return STARS.map(([sel, fx]) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width * fx, y: r.top + sy - 46 }
  })
}

export default function PlayLayer({ show, onToast }) {
  const [playing, setPlaying] = useState(false)
  const [touch, setTouch] = useState(false)
  const canvas = useRef()
  const hud = useRef()
  const input = useRef({ left: false, right: false, jump: false, down: false })
  const game = useRef(null)

  const toggle = useCallback(() => setPlaying((p) => !p), [])

  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches)
    const onToggle = () => toggle()
    window.addEventListener('toggle-game', onToggle)
    return () => window.removeEventListener('toggle-game', onToggle)
  }, [toggle])

  // Keyboard: P toggles, Esc quits, R respawns. Arrow keys and space are only
  // captured while playing and nothing else wants them.
  useEffect(() => {
    const map = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'jump', w: 'jump', ' ': 'jump', ArrowDown: 'down', s: 'down' }
    const onKey = (e) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      const down = e.type === 'keydown'
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (down && k === 'p' && !modalOpen()) { setPlaying((p) => !p); return }
      if (!playing) return
      if (down && k === 'Escape' && !modalOpen()) { setPlaying(false); return }
      if (down && k === 'r') { game.current?.respawn(); return }
      const action = map[k]
      if (!action || modalOpen()) return
      e.preventDefault()
      if (down && !input.current[action]) game.current?.press(action)
      input.current[action] = down
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [playing])

  useEffect(() => {
    if (!playing) return undefined
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    const img = sprite()
    // On phones the touch pad covers the bottom of the screen, so keep Purin higher.
    const low = window.matchMedia('(pointer: coarse)').matches ? 0.5 : 0.7
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      cv.width = window.innerWidth * dpr
      cv.height = window.innerHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    let plats = scan()
    let stars = scanStars()
    const got = new Set()
    let lastScan = 0
    const p = { x: 0, y: 0, vx: 0, vy: 0, face: 1, on: null, air: 0, buffer: 0, drop: 0, squash: 0 }
    const dust = []
    const confetti = []
    let time = 0
    let won = false
    let prompt = null
    let best = load()

    const respawn = () => {
      const h1 = document.querySelector('#home h1')?.getBoundingClientRect()
      const onScreen = h1 && h1.bottom > 0 && h1.top < window.innerHeight
      p.x = onScreen ? h1.left + 10 : window.innerWidth * 0.2
      p.y = window.scrollY + (onScreen ? h1.top - 140 : 90)
      p.vx = 0; p.vy = 0; p.on = null
    }
    respawn()

    game.current = {
      respawn,
      press(action) {
        if (action === 'jump') p.buffer = BUFFER
        if (action === 'down' && p.on) {
          const card = p.on.el.closest('.card')
          if (card?.dataset.project) {
            input.current.down = false
            window.dispatchEvent(new CustomEvent('open-project', { detail: card.dataset.project }))
          } else p.drop = 0.25
        }
        // If the page was scrolled away from Purin, bring Purin to the view.
        const sy = p.y - window.scrollY
        if (sy < -H * 2 || sy > window.innerHeight + H) {
          p.x = Math.min(p.x, window.innerWidth - W)
          p.y = window.scrollY + 80
          p.vy = 0; p.on = null
        }
      },
    }

    const burst = (x, y, n, list, colors) => {
      for (let i = 0; i < n; i++) {
        list.push({ x, y, vx: (Math.random() - 0.5) * 420, vy: -Math.random() * 520, life: 0.6 + Math.random() * 0.8, c: colors[i % colors.length] })
      }
    }

    let last = performance.now()
    let raf
    const step = (now) => {
      raf = requestAnimationFrame(step)
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      if (modalOpen()) { Object.keys(input.current).forEach((k) => { input.current[k] = false }); return }

      if (now - lastScan > 220) { plats = scan(); stars = scanStars(); lastScan = now }
      const vw = window.innerWidth
      const sy = window.scrollY
      const floor = document.documentElement.scrollHeight - 2
      const i = input.current

      if (!won) time += dt
      const dir = (i.right ? 1 : 0) - (i.left ? 1 : 0)
      p.vx += (dir * RUN - p.vx) * Math.min(1, dt * (p.on ? 14 : 6))
      if (dir) p.face = dir

      // Stay attached to a platform that moved (reveal animations, reflow).
      if (p.on) {
        const same = plats.find((q) => q.key === p.on.key && q.el === p.on.el)
        if (same && p.x + W * 0.8 > same.x1 && p.x + W * 0.2 < same.x2) { p.on = same; p.y = same.y - H }
        else p.on = null
      }

      p.air = p.on ? 0 : p.air + dt
      p.buffer -= dt
      p.drop -= dt
      if (p.buffer > 0 && p.air < COYOTE) {
        p.vy = -JUMP; p.on = null; p.air = COYOTE; p.buffer = 0; p.squash = -0.25
      }
      if (!p.on) {
        p.vy += G * dt * (p.vy < 0 && !i.jump ? 2.2 : 1)
        p.vy = Math.min(p.vy, 1400)
      }
      if (p.on && p.drop > 0) { p.on = null; p.y += 2 }

      const prevBottom = p.y + H
      p.x = Math.max(0, Math.min(vw - W, p.x + p.vx * dt))
      if (!p.on) p.y += p.vy * dt
      const bottom = p.y + H

      if (!p.on && p.vy >= 0) {
        let land = null
        for (const q of plats) {
          if (p.drop > 0 && q.y <= prevBottom + 4) continue
          if (prevBottom <= q.y + 1 && bottom >= q.y && p.x + W * 0.8 > q.x1 && p.x + W * 0.2 < q.x2 && (!land || q.y < land.y)) land = q
        }
        if (land || bottom >= floor) {
          if (p.vy > 500) { p.squash = 0.3; burst(p.x + W / 2, (land ? land.y : floor), 6, dust, ['rgba(255,255,255,0.5)']) }
          p.on = land || { key: 'floor', el: document.body, x1: 0, x2: vw, y: floor }
          p.y = p.on.y - H
          p.vy = 0
        }
      }
      p.squash *= Math.pow(0.0001, dt)

      // Stars.
      stars.forEach((s, n) => {
        if (!s || got.has(n)) return
        if (Math.abs(p.x + W / 2 - s.x) < 26 && Math.abs(p.y + H / 2 - s.y) < 30) {
          got.add(n)
          burst(s.x, s.y, 14, dust, ['#ffd76a', '#8ab4ff', '#ffffff'])
          if (got.size === STARS.length && !won) {
            won = true
            burst(vw / 2, sy + 40, 120, confetti, ['#8ab4ff', '#ffd76a', '#ff9aa8', '#7be0b0', '#ffffff'])
            const record = !best || time < best
            if (record) { best = time; save(time) }
            onToast?.(record ? `All stars in ${fmt(time)}. New best!` : `All stars in ${fmt(time)}. Best ${fmt(best)}`)
          }
        }
      })

      // Card prompt.
      const card = p.on?.el?.closest?.('.card')
      prompt = card?.dataset.project ? card.dataset.project : null

      // Camera: follow Purin only while Purin is moving, so manual scrolling
      // is never fought.
      const screenY = p.y - sy
      const vh = window.innerHeight
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

      for (const list of [dust, confetti]) {
        for (let k = list.length - 1; k >= 0; k--) {
          const d = list[k]
          d.life -= dt
          if (d.life <= 0) { list.splice(k, 1); continue }
          d.vy += G * 0.5 * dt
          d.x += d.vx * dt
          d.y += d.vy * dt
          ctx.globalAlpha = Math.min(1, d.life * 2)
          ctx.fillStyle = d.c
          ctx.fillRect(d.x - 2, d.y - oy - 2, list === confetti ? 5 : 3, list === confetti ? 8 : 3)
        }
      }
      ctx.globalAlpha = 1

      // Purin with squash and stretch, plus a little run bob.
      const bob = p.on && Math.abs(p.vx) > 30 ? Math.abs(Math.sin(t * 16)) * 2 : 0
      const sx = 1 + p.squash
      const syc = 1 - p.squash
      const cx = p.x + W / 2
      const by = p.y + H - oy - bob
      ctx.save()
      ctx.translate(cx, by)
      ctx.scale(sx * p.face, syc)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, -W / 2, -H)
      ctx.restore()
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(cx - W * 0.35, p.y + H - oy + 1, W * 0.7, 2)

      if (prompt) {
        const label = 'Press ↓ to open'
        ctx.font = '600 12px Inter, system-ui, sans-serif'
        const tw = ctx.measureText(label).width + 16
        const px = Math.max(4, Math.min(vw - tw - 4, cx - tw / 2))
        const py = p.y - oy - 30
        ctx.fillStyle = '#e9ecf2'
        ctx.beginPath()
        ctx.roundRect(px, py, tw, 22, 11)
        ctx.fill()
        ctx.fillStyle = '#0a0a0b'
        ctx.fillText(label, px + 8, py + 15)
      }

      if (hud.current) hud.current.textContent = `★ ${got.size}/${STARS.length}  ·  ${fmt(time)}${best ? `  ·  best ${fmt(best)}` : ''}`
    }
    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      Object.keys(input.current).forEach((k) => { input.current[k] = false })
      game.current = null
    }
  }, [playing, onToast])

  const hold = (action) => ({
    onPointerDown: (e) => { e.preventDefault(); game.current?.press(action); input.current[action] = true },
    onPointerUp: () => { input.current[action] = false },
    onPointerLeave: () => { input.current[action] = false },
    onPointerCancel: () => { input.current[action] = false },
    onContextMenu: (e) => e.preventDefault(),
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
                {!touch && <span className="play-keys"><kbd>←</kbd><kbd>→</kbd> move <kbd>↑</kbd> jump <kbd>↓</kbd> drop · open</span>}
                <button className="play-btn" onClick={() => setPlaying(false)}>Quit {!touch && <kbd>Esc</kbd>}</button>
              </>
            ) : (
              <button className="play-btn primary" onClick={() => setPlaying(true)} aria-label="Play the portfolio game">
                <span className="play-icon" aria-hidden="true">▶</span> Play {!touch && <kbd>P</kbd>}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {playing && touch && (
        <div className="play-pad">
          <div>
            <button aria-label="Left" {...hold('left')}>◀</button>
            <button aria-label="Right" {...hold('right')}>▶</button>
          </div>
          <div>
            <button aria-label="Drop or open" {...hold('down')}>▼</button>
            <button aria-label="Jump" className="jump" {...hold('jump')}>▲</button>
          </div>
        </div>
      )}
    </>
  )
}

function drawStar(ctx, x, y, r, t) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.sin(t * 2) * 0.2)
  ctx.shadowColor = 'rgba(255, 215, 106, 0.8)'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#ffd76a'
  ctx.beginPath()
  for (let k = 0; k < 10; k++) {
    const a = (k * Math.PI) / 5 - Math.PI / 2
    const rr = k % 2 ? r * 0.45 : r
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

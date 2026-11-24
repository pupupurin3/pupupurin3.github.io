import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from 'react'
import { AnimatePresence, motion, useAnimationControls, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { profile } from '../../content/profile'
import { heroModels } from '../../content/showcase'
import { emit } from '../../lib/events'
import { ease } from '../../lib/motion'
import { ModelViewer } from '../three/LazyModelViewer'
import { ToolIcon } from '../ui/ToolIcon'
import { SECTIONS } from '../layout/Nav'

// One letter that fades up out of a soft blur.
function Letter({ ch, start, delay }: { ch: string; start: boolean; delay: number }) {
  return (
    <motion.span
      className="hero-letter"
      initial={{ opacity: 0, y: '0.3em', filter: 'blur(8px)' }}
      animate={start ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 1, delay, ease }}
    >
      {ch}
    </motion.span>
  )
}

function FadeLetters({ words, start, delay = 0, step = 0.045, className }: { words: string[]; start: boolean; delay?: number; step?: number; className: string }) {
  let i = 0
  return words.map((word, w) => (
    <span key={w} className={className}>
      {[...word].map((ch) => <Letter key={i} ch={ch} start={start} delay={delay + i++ * step} />)}
    </span>
  ))
}

/**
 * Editorial hero: name and links on the left, a slanted panel on the right
 * with my latest 3D work live in a viewer, and a "new" strip pointing at what
 * I'm working on now.
 */
export function Hero({ start }: { start: boolean }) {
  const [modelIdx, setModelIdx] = useState(0)
  const section = useRef<HTMLElement>(null)
  const still = useReducedMotion()
  const wide = useWide()
  // On wide screens the hero is pinned while you scroll, and the white side
  // sweeps right across the model panel instead of the page moving up.
  const pinned = wide && !still

  // While pinned, the first part of the scroll steps through the models and
  // the last part sweeps the white side across.
  const count = heroModels.length
  const modelsEnd = count / (count + 1)
  const { scrollYProgress } = useScroll({ target: section, offset: pinned ? ['start start', 'end end'] : ['start start', 'end start'] })
  const wipe = useTransform(scrollYProgress, [modelsEnd, modelsEnd + (1 - modelsEnd) * 0.9], [0, 1], { clamp: true })
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (pinned) setModelIdx(Math.min(count - 1, Math.floor((p / modelsEnd) * count)))
  })
  const showModel = (i: number) => {
    const el = section.current
    if (!pinned || !el) return setModelIdx(i)
    const run = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: el.offsetTop + ((i + 0.5) / count) * modelsEnd * run, behavior: 'smooth' })
  }
  // Each new model rises in from below.
  const swap = useAnimationControls()
  useEffect(() => {
    void swap.start({ opacity: [0, 1], y: [40, 0], transition: { duration: 0.6, ease } })
  }, [modelIdx, swap])
  const wipeClip = useTransform(wipe, (w) => `polygon(${14 + 116 * w}% 0, 100% 0, 100% 100%, ${100 * w}% 100%)`)
  // Parallax: the photo, number and model drift at different rates while the
  // hero scrolls (or is swept away), and the cursor shifts them against each other.
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 })
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 })
  const sy = (n: number) => (pinned ? 0 : scrollYProgress.get() * n)
  const sx = (n: number) => (pinned ? wipe.get() * n : 0)
  const bgY = useTransform(() => sy(140) + my.get() * 10)
  const bgX = useTransform(() => sx(90) + mx.get() * -14)
  const noY = useTransform(() => sy(-220) + my.get() * -22)
  const noX = useTransform(() => sx(-160) + mx.get() * 26)
  const modelY = useTransform(() => sy(60) + my.get() * 8)
  const modelX = useTransform(() => sx(220) + mx.get() * 12)
  const textX = useTransform(() => sx(60))
  const onPointer = (e: PointerEvent) => {
    if (still || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1)
    my.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }
  const layer = (x: typeof bgX, y: typeof bgY) => (still ? undefined : { x, y })
  const current = heroModels[modelIdx]!
  const fade = (delay: number, y = 14) => ({
    initial: { opacity: 0, y },
    animate: start ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.9, delay, ease },
  })
  const [given = '', family = ''] = profile.name.toUpperCase().split(' ')

  return (
    <section id="home" className={`hero-wrap ${pinned ? 'pinned' : ''}`} ref={section} style={{ '--steps': count + 1 } as React.CSSProperties}>
    <div className="hero" onPointerMove={onPointer} onPointerLeave={() => { mx.set(0); my.set(0) }}>
      <motion.div className="hero-text" style={pinned ? { x: textX } : undefined}>
        <motion.p className="hero-kicker" {...fade(0.1, 6)}>
          <span>Portfolio</span>
          <span>{new Date().getFullYear()}</span>
        </motion.p>
        <h1 className="hero-title" aria-label={profile.name}>
          <FadeLetters words={[given, family]} start={start} delay={0.2} className="hero-word" />
        </h1>
        <div className="hero-sub">
          <motion.span className="hero-rule" aria-hidden="true" initial={{ scaleX: 0 }} animate={start ? { scaleX: 1 } : {}} transition={{ duration: 1.2, delay: 0.7, ease }} />
          <motion.p className="hero-kanji" lang="ja" {...fade(0.9, 0)}>{profile.nameJa}</motion.p>
        </div>
        <motion.p className="hero-roles" {...fade(1.0)}>{profile.roles.join(' / ')}</motion.p>

        <nav className="hero-links" aria-label="Sections">
          {SECTIONS.map(([id, label], i) => (
            <motion.a key={id} href={`#${id}`} {...fade(1.1 + i * 0.07)}>
              <span className="hero-link-no">{String(i + 1).padStart(2, '0')}</span>
              {label}
            </motion.a>
          ))}
        </nav>

        <motion.div className="hero-cta" {...fade(1.5)}>
          <a href="#work" className="btn primary">View work</a>
          <a href="#lab" className="btn">Explore the lab</a>
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-panel"
        initial={{ clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' }}
        animate={start ? { clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 0% 100%)' } : {}}
        transition={{ duration: 1.3, delay: 0.15, ease: [0.76, 0, 0.24, 1] }}
      >
        <motion.div className="hero-panel-inner" style={pinned ? { clipPath: wipeClip } : undefined}>
        <motion.div className="hero-panel-bg" aria-hidden="true" style={{ backgroundImage: `url(${profile.heroPhoto})`, ...layer(bgX, bgY) }} />
        <motion.span className="hero-panel-no" aria-hidden="true" style={layer(noX, noY)}>{String(modelIdx + 1).padStart(2, '0')}</motion.span>
        {/* The model floats gently up and down (CSS) inside a parallax layer. */}
        <motion.div className="hero-float-layer" style={layer(modelX, modelY)}>
          <motion.div className="hero-float" animate={swap}>
            {start && <ModelViewer model={current.model} className="hero-viewer" chrome={false} zoom={false} />}
          </motion.div>
        </motion.div>

        <div className="hero-dots" role="tablist" aria-label="3D models" aria-orientation="vertical">
          {heroModels.map((m, i) => (
            <button key={m.name} role="tab" aria-selected={i === modelIdx} aria-label={m.name} className={i === modelIdx ? 'on' : ''} onClick={() => showModel(i)}>
              <span />
            </button>
          ))}
        </div>

        <div className="hero-model-meta" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={current.name} className="hero-model-card" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.35, ease }}>
              <span className="hero-model-count">{String(modelIdx + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
              <strong>{current.name}</strong>
              {current.date && <time>{current.date}</time>}
              <span className="hero-model-tools">{current.tools.map((t) => <ToolIcon key={t} tool={t} />)}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        </motion.div>
      </motion.div>

      <motion.button className="hero-new" onClick={() => emit('open-project', 'angela-toy-figure')} {...fade(1.7, 20)}>
        <span className="hero-new-tag">New</span>
        <span>Angela, a chibi toy figure in Maya + Arnold</span>
        <span aria-hidden="true">→</span>
      </motion.button>
    </div>
    </section>
  )
}

const WIDE = '(min-width: 901px)'
/** True on screens wide enough for the side-by-side hero. */
function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(WIDE)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(WIDE).matches,
    () => true,
  )
}

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'

const TIPS = [
  'Stacking voxels...',
  'Compiling shaders...',
  'Polishing pixels...',
  'Pouring caramel...',
  'Spawning projects...',
]
const SEGMENTS = 20
const MIN_DURATION = 1800
const MAX_WAIT = 6000

// Retro game-style boot screen. Progress follows real asset loading (fonts,
// window load, Three.js loaders) but never finishes faster than MIN_DURATION,
// so the animation always gets to play. Exits with a split-curtain wipe.
export default function LoadingScreen({ onDone }) {
  const { active, progress: assetProgress } = useProgress()
  const [ready, setReady] = useState(false)
  const [time, setTime] = useState(0)
  const [tip, setTip] = useState(0)
  const [visible, setVisible] = useState(true)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })))
    Promise.all([loaded, document.fonts?.ready]).then(() => setReady(true))
    // Never trap visitors on a slow connection: stop waiting after MAX_WAIT.
    const giveUp = setTimeout(() => setTimedOut(true), MAX_WAIT)
    const t0 = performance.now()
    let raf
    const tick = () => {
      setTime(Math.min((performance.now() - t0) / MIN_DURATION, 1))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const tipTimer = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 450)
    return () => { cancelAnimationFrame(raf); clearInterval(tipTimer); clearTimeout(giveUp) }
  }, [])

  const eased = 1 - Math.pow(1 - time, 2)
  const assets = active ? assetProgress / 100 : 1
  // Hold at 95% until everything has actually loaded (or we give up).
  const progress = timedOut ? eased : Math.min(eased, ready ? assets : 0.95)
  const done = progress >= 1

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setVisible(false), 350)
    return () => clearTimeout(t)
  }, [done])

  const filled = Math.round(progress * SEGMENTS)

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div className="loader" key="loader" exit={{ pointerEvents: 'none' }} transition={{ duration: 0.9 }}>
          <motion.div className="loader-half top" exit={{ y: '-100%' }} transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }} />
          <motion.div className="loader-half bottom" exit={{ y: '100%' }} transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }} />
          <motion.div
            className="loader-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.35 }}
          >
            <div className="loader-sprite" aria-hidden="true">
              {Array.from({ length: 4 }, (_, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -14, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                />
              ))}
            </div>
            <div className="loader-title">{done ? 'READY!' : 'LOADING'}<span className="blink">_</span></div>
            <div className="loader-bar" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              {Array.from({ length: SEGMENTS }, (_, i) => (
                <span key={i} className={i < filled ? 'on' : ''} />
              ))}
            </div>
            <div className="loader-meta">
              <span>{done ? 'Press start' : TIPS[tip]}</span>
              <span>{String(Math.round(progress * 100)).padStart(3, '0')}%</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

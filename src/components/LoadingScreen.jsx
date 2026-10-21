import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'
import { profile } from '../data/content'

const MIN_DURATION = 1600
const MAX_WAIT = 6000

// Minimal intro: a large counter and a hairline progress bar. Progress
// follows real loading (fonts, window load, Three.js loaders) but takes at
// least MIN_DURATION and gives up waiting after MAX_WAIT. The panel then
// lifts away with a clip-path reveal.
export default function LoadingScreen({ onDone }) {
  const { active, progress: assetProgress } = useProgress()
  const [ready, setReady] = useState(false)
  const [time, setTime] = useState(0)
  const [visible, setVisible] = useState(true)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })))
    Promise.all([loaded, document.fonts?.ready]).then(() => setReady(true))
    const giveUp = setTimeout(() => setTimedOut(true), MAX_WAIT)
    const t0 = performance.now()
    let raf
    const tick = () => {
      setTime(Math.min((performance.now() - t0) / MIN_DURATION, 1))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); clearTimeout(giveUp) }
  }, [])

  const eased = 1 - Math.pow(1 - time, 3)
  const assets = active ? assetProgress / 100 : 1
  // Hold at 95% until everything has actually loaded (or we give up).
  const progress = timedOut ? eased : Math.min(eased, ready ? assets : 0.95)
  const done = progress >= 1

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setVisible(false), 250)
    return () => clearTimeout(t)
  }, [done])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          className="loader"
          key="loader"
          initial={{ clipPath: 'inset(0 0 0 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="loader-top">
            <span>{profile.name}</span>
            <span>Portfolio · {new Date().getFullYear()}</span>
          </div>
          <div className="loader-bottom">
            <motion.span className="loader-count" exit={{ y: '-30%', opacity: 0 }} transition={{ duration: 0.4 }}>
              {String(Math.round(progress * 100)).padStart(3, '0')}
            </motion.span>
            <div className="loader-line" role="progressbar" aria-label="Loading" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ transform: `scaleX(${progress})` }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'

const TIPS = [
  'Rewinding tapes...',
  'Dusting the shelves...',
  'Compiling shaders...',
  'Restocking new releases...',
  'Tuning the CRT...',
]
const MIN_DURATION = 1800
const MAX_WAIT = 6000

// A cassette whose reels spin while the tape winds from one side to the other
// as progress grows.
function TapeLoader({ progress }) {
  const left = 30 - progress * 14
  const right = 16 + progress * 14
  return (
    <svg className="tape-loader" viewBox="0 0 220 140" aria-hidden="true">
      <rect x="4" y="4" width="212" height="132" rx="12" fill="#1c1c1c" stroke="#f2f2f2" strokeWidth="4" />
      <rect x="22" y="18" width="176" height="38" rx="4" fill="#d7ff1f" />
      <text x="34" y="44" className="tape-loader-label">PURIN · SIDE A</text>
      <rect x="50" y="64" width="120" height="44" rx="22" fill="#0c0c0c" stroke="#555" strokeWidth="2" />
      <circle cx="78" cy="86" r={left} fill="#3a2a1e" />
      <circle cx="142" cy="86" r={right} fill="#3a2a1e" />
      {[78, 142].map((cx) => (
        <g key={cx} className="tape-reel" style={{ transformOrigin: `${cx}px 86px` }}>
          <circle cx={cx} cy="86" r="11" fill="#f2f2f2" />
          {[0, 60, 120].map((a) => (
            <rect key={a} x={cx - 2} y="76" width="4" height="20" fill="#1c1c1c" transform={`rotate(${a} ${cx} 86)`} />
          ))}
        </g>
      ))}
      <path d="M60 136 L72 116 H148 L160 136" fill="#2a2a2a" />
    </svg>
  )
}

// Boot screen: progress follows real loading (fonts, window load, Three.js
// loaders) but takes at least MIN_DURATION so the animation plays, and gives
// up waiting after MAX_WAIT. Exits with two slanted panels sweeping away.
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
    const giveUp = setTimeout(() => setTimedOut(true), MAX_WAIT)
    const t0 = performance.now()
    let raf
    const tick = () => {
      setTime(Math.min((performance.now() - t0) / MIN_DURATION, 1))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const tipTimer = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 500)
    return () => { cancelAnimationFrame(raf); clearInterval(tipTimer); clearTimeout(giveUp) }
  }, [])

  const eased = 1 - Math.pow(1 - time, 2)
  const assets = active ? assetProgress / 100 : 1
  // Hold at 95% until everything has actually loaded (or we give up).
  const progress = timedOut ? eased : Math.min(eased, ready ? assets : 0.95)
  const done = progress >= 1

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setVisible(false), 400)
    return () => clearTimeout(t)
  }, [done])

  const ease = [0.76, 0, 0.24, 1]

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div className="loader" key="loader" exit={{ pointerEvents: 'none' }} transition={{ duration: 0.9 }}>
          <motion.div className="loader-panel acid" exit={{ x: '110%' }} transition={{ duration: 0.75, ease, delay: 0.12 }} />
          <motion.div className="loader-panel ink" exit={{ x: '110%' }} transition={{ duration: 0.75, ease }} />
          <motion.div
            className="loader-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.3 }}
          >
            <TapeLoader progress={progress} />
            <div className="loader-title">{done ? 'PLAY ▶' : 'NOW LOADING'}</div>
            <div className="loader-bar" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="loader-fill" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="loader-meta">
              <span>{done ? 'Tape ready' : TIPS[tip]}</span>
              <span>{String(Math.round(progress * 100)).padStart(3, '0')}%</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

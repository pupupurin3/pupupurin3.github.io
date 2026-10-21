import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'
import { profile } from '../data/content'

const MIN_DURATION = 1900
const MAX_WAIT = 6000
const TOP = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0']
const MID = ['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0']
const LOW = ['#00214c', '#ffffff', '#32006a', '#131313', '#090909', '#131313', '#1d1d1d', '#131313']

// The TV warms up: a bright line opens into SMPTE colour bars while the
// site loads, with the load shown as VCR tracking bars. When everything is
// ready the picture breaks into static and tunes to channel 1.
// Progress follows real loading (fonts, window load, Three.js loaders) but
// takes at least MIN_DURATION and gives up waiting after MAX_WAIT.
export default function LoadingScreen({ onDone }) {
  const { active, progress: assetProgress } = useProgress()
  const [ready, setReady] = useState(false)
  const [time, setTime] = useState(0)
  const [phase, setPhase] = useState('bars')
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
  const pct = Math.round(progress * 100)

  useEffect(() => {
    if (!done) return undefined
    const a = setTimeout(() => setPhase('static'), 350)
    const b = setTimeout(() => setVisible(false), 750)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [done])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div className="loader" key="loader" exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <div className="boot-screen">
            <div className="bars" aria-hidden="true">
              <div className="bars-top">{TOP.map((c) => <i key={c} style={{ background: c }} />)}</div>
              <div className="bars-mid">{MID.map((c, i) => <i key={i} style={{ background: c }} />)}</div>
              <div className="bars-low">{LOW.map((c, i) => <i key={i} style={{ background: c }} />)}</div>
            </div>
            <div className="boot-osd">
              <span className="boot-ch">CH 01</span>
              <span className="boot-vcr">{done ? 'PLAY ▶' : 'LOADING'}</span>
              <div className="boot-card">
                <strong>{profile.name.toUpperCase()}</strong>
                <span>PORTFOLIO · {new Date().getFullYear()}</span>
              </div>
              <div className="boot-track" role="progressbar" aria-label="Loading" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <span>TRACKING</span>
                <span className="osd-bars">{Array.from({ length: 16 }, (_, i) => <i key={i} className={i < Math.round(progress * 16) ? 'on' : ''} />)}</span>
                <span>{String(pct).padStart(3, '0')}%</span>
              </div>
            </div>
            {phase === 'static' && <div className="boot-static" />}
            <div className="boot-warm" aria-hidden="true" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

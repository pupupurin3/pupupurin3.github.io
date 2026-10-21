import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTV } from './TVContext'

// Power off collapses the picture into a bright line and then a dot, the way
// a CRT does. Turning it back on plays the same thing in reverse.
export default function PowerScreen() {
  const { power, powerOn } = useTV()

  useEffect(() => {
    if (power !== 'off') return undefined
    const onKey = (e) => { if (!e.metaKey && !e.ctrlKey) powerOn() }
    const t = setTimeout(() => window.addEventListener('keydown', onKey), 400)
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey) }
  }, [power, powerOn])

  const half = { on: { scaleY: 0 }, off: { scaleY: 1 } }
  return (
    <AnimatePresence>
      {power === 'off' && (
        <motion.div className="power-off" initial="on" animate="off" exit="on" role="dialog" aria-modal="true" aria-label="TV is off">
          <motion.div className="po-half top" variants={half} transition={{ duration: 0.22, ease: 'easeIn' }} />
          <motion.div className="po-half bottom" variants={half} transition={{ duration: 0.22, ease: 'easeIn' }} />
          <motion.div
            className="po-line"
            variants={{
              on: { scaleX: [0, 0.005, 1], scaleY: [0, 1, 1], opacity: [0, 1, 0] },
              off: { scaleX: [1, 0.005, 0], scaleY: [1, 1, 0], opacity: [1, 1, 0] },
            }}
            transition={{ duration: 0.5, delay: 0.15, times: [0, 0.6, 1] }}
          />
          <motion.div className="po-standby" variants={{ on: { opacity: 0 }, off: { opacity: 1 } }} transition={{ delay: 0.8, duration: 0.6 }}>
            <span className="po-led" />
            <button className="po-btn" onClick={powerOn}>⏻ Power on</button>
            <p>or press any key</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

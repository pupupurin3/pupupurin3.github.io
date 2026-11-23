import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { profile } from '../../content/profile'
import { emit } from '../../lib/events'
import { ease } from '../../lib/motion'
import { SECTIONS } from './Nav'

const ALL = [['home', 'Home'], ...SECTIONS] as const

/**
 * A thin rail down the left edge on wide screens: the name set vertically,
 * a menu button (the command palette) and the current section, which rolls
 * over as you scroll.
 */
export function Rail({ show }: { show: boolean }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(ALL.findIndex(([id]) => id === e.target.id))),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    for (const [id] of ALL) {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])

  const go = (i: number) => document.getElementById(ALL[Math.min(Math.max(i, 0), ALL.length - 1)]![0])?.scrollIntoView({ behavior: 'smooth' })
  const [, label] = ALL[Math.max(active, 0)]!

  return (
    <motion.aside className="rail" initial={{ x: '-100%' }} animate={show ? { x: 0 } : {}} transition={{ duration: 0.8, delay: 0.2, ease }}>
      <a href="#home" className="rail-name" aria-label={`${profile.name}, back to top`}>
        <span>{profile.name}</span>
        <small>Portfolio</small>
      </a>
      <button className="rail-menu" onClick={() => emit('open-palette')} aria-label="Open menu">
        <span /><span /><span />
      </button>
      <div className="rail-foot">
        <div className="rail-section" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={label} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} transition={{ duration: 0.4, ease }}>
              {label}
            </motion.span>
          </AnimatePresence>
        </div>
        <span className="rail-count">{String(Math.max(active, 0) + 1).padStart(2, '0')}</span>
        <div className="rail-arrows">
          <button onClick={() => go(active - 1)} aria-label="Previous section" disabled={active <= 0}>‹</button>
          <button onClick={() => go(active + 1)} aria-label="Next section" disabled={active >= ALL.length - 1}>›</button>
        </div>
      </div>
    </motion.aside>
  )
}

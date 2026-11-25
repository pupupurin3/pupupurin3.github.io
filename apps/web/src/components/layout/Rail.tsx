import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { profile } from '../../content/profile'
import { emit } from '../../lib/events'
import { ease } from '../../lib/motion'
import { SECTIONS } from './Nav'

const ALL = [['home', 'Home'], ...SECTIONS] as const

/**
 * The vertical navbar down the left edge on wide screens. The strip (name,
 * current section, arrows) is always there. Over the hero, which has its own
 * links, the section links and the menu button are tucked away; once the
 * hero scrolls off they slide in.
 */
export function Rail({ show }: { show: boolean }) {
  const [active, setActive] = useState(0)
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(ALL.findIndex(([id]) => id === e.target.id))),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    for (const [id] of ALL) {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    }
    const onScroll = () => {
      const hero = document.getElementById('home')
      if (!hero) return setPastHero(true)
      // A pinned hero is taller than the screen: wait until its sweep is nearly done.
      const h = hero.offsetHeight, vh = window.innerHeight
      setPastHero(window.scrollY > (h > vh * 1.5 ? (h - vh) * 0.95 : h * 0.6))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])

  const go = (i: number) => document.getElementById(ALL[Math.min(Math.max(i, 0), ALL.length - 1)]![0])?.scrollIntoView({ behavior: 'smooth' })
  const [activeId, label] = ALL[Math.max(active, 0)]!

  return (
    <motion.aside className="rail" initial={{ x: '-100%' }} animate={show ? { x: 0 } : {}} transition={{ duration: 0.8, delay: 0.2, ease }}>
      <a href="#home" className="rail-name" aria-label={`${profile.name}, back to top`}>
        <span>{profile.name}</span>
        <small>Portfolio</small>
      </a>

      <AnimatePresence>
        {pastHero && (
          <motion.nav
            className="rail-nav"
            aria-label="Sections"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.45, ease }}
          >
            <button className="rail-menu" onClick={() => emit('open-palette')} aria-label="Open menu">
              <span /><span /><span />
            </button>
            <ul>
              {SECTIONS.map(([id, text], i) => (
                <motion.li key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.4, ease }}>
                  <a href={`#${id}`} className={activeId === id ? 'on' : ''} aria-current={activeId === id ? 'true' : undefined}>
                    {activeId === id && <motion.i layoutId="rail-dot" className="rail-dot" />}
                    {text}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>

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

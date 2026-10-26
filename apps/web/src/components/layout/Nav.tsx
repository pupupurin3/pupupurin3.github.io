import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { profile } from '../../content/profile'
import { emit } from '../../lib/events'
import { ease } from '../../lib/motion'
import { modKey } from '../../lib/platform'

export const SECTIONS = [
  ['work', 'Work'],
  ['lab', 'Lab'],
  ['about', 'About'],
  ['contact', 'Contact'],
] as const

export function Nav({ show }: { show: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    // The hero is a full-screen poster, so the bar only slides in once it has scrolled away.
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      const hero = document.getElementById('home')
      setPastHero(!hero || window.scrollY > hero.offsetHeight - 72)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    for (const id of ['home', ...SECTIONS.map(([id]) => id)]) {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    }
    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
    }
  }, [])

  const visible = show && pastHero
  return (
    <motion.nav
      className={`nav ${scrolled ? 'scrolled' : ''} ${visible ? '' : 'nav-hidden'}`}
      initial={{ y: '-110%', opacity: 0 }}
      animate={visible ? { y: 0, opacity: 1 } : { y: '-110%', opacity: 0 }}
      transition={{ duration: 0.5, ease }}
    >
      <a href="#home" className="brand">
        {profile.name}
      </a>
      <ul>
        {SECTIONS.map(([id, label]) => (
          <li key={id}>
            <a href={`#${id}`} className={active === id ? 'active' : ''}>
              {active === id && (
                <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
              )}
              <span className="label">{label}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="nav-end">
        <button className="kbd-btn" onClick={() => emit('open-palette')} aria-label="Open command palette">
          <span className="kbd-btn-text">Search</span>
          <span className="kbd-btn-menu">Menu</span>
          <kbd>{modKey}</kbd>
          <kbd>K</kbd>
        </button>
      </div>
    </motion.nav>
  )
}

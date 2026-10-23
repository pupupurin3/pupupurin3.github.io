import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { modKey } from './CommandPalette'
import { aboutPhotos, education, experience, profile, skills } from '../data/content'
import { getTheme, toggleTheme } from '../theme'

const ease = [0.22, 1, 0.36, 1]

// Sun/moon switch. The knob slides across and the icon swaps.
function ThemeSwitch() {
  const [theme, setThemeState] = useState(getTheme)
  useEffect(() => {
    const sync = () => setThemeState(getTheme())
    window.addEventListener('theme-change', sync)
    return () => window.removeEventListener('theme-change', sync)
  }, [])
  const dark = theme === 'dark'
  return (
    <button className="theme-switch" role="switch" aria-checked={dark} aria-label="Dark mode" onClick={toggleTheme}>
      <motion.span className="theme-knob" layout transition={{ type: 'spring', stiffness: 500, damping: 32 }}>
        {dark ? (
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor" /><g stroke="currentColor" strokeWidth="2" strokeLinecap="round">{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="12" y1="2.5" x2="12" y2="4.5" transform={`rotate(${a} 12 12)`} />)}</g></svg>
        )}
      </motion.span>
    </button>
  )
}

// Fades and lifts children into place the first time they scroll into view.
export function Reveal({ children, delay = 0, className, as = 'div' }) {
  const M = motion[as]
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </M>
  )
}

export function SectionHeader({ index, title, lede }) {
  return (
    <header className="section-header">
      <Reveal className="section-index">{index}</Reveal>
      <div>
        <Reveal as="h2">{title}</Reveal>
        {lede && <Reveal as="p" delay={0.08} className="section-lede">{lede}</Reveal>}
      </div>
    </header>
  )
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30 })
  return <motion.div className="scroll-progress" style={{ scaleX }} />
}

const NAV = [
  ['work', 'Work'],
  ['lab', 'Lab'],
  ['about', 'About'],
  ['contact', 'Contact'],
]

export function Nav({ show }) {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ;['home', ...NAV.map(([id]) => id)].forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => { window.removeEventListener('scroll', onScroll); io.disconnect() }
  }, [])

  return (
    <motion.nav
      className={`nav ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -24, opacity: 0 }}
      animate={show ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.6, ease, delay: 0.2 }}
    >
      <a href="#home" className="brand">Noah Matsukuma</a>
      <ul>
        {NAV.map(([id, label]) => (
          <li key={id}>
            <a href={`#${id}`} className={active === id ? 'active' : ''}>
              {active === id && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <span className="label">{label}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="nav-end">
      <ThemeSwitch />
      <button className="kbd-btn" onClick={() => window.dispatchEvent(new Event('open-palette'))} aria-label="Open command palette">
        <span className="kbd-btn-text">Search</span><span className="kbd-btn-menu">Menu</span><kbd>{modKey}</kbd><kbd>K</kbd>
      </button>
      </div>
    </motion.nav>
  )
}

// Photos as overlapping sticker cards. Hover lifts and straightens one, click
// (or a quick tap) brings it to the front, and each can be dragged and flicked
// around, springing back to its place on release.
// Positions are percentages of the stack so it scales with its column.
const POSE = [
  { x: 0, y: 28, r: -4, w: 64 },
  { x: 42, y: 56, r: 3, w: 56 },
  { x: 52, y: 0, r: 4, w: 46 },
]

function PhotoStack() {
  const [order, setOrder] = useState(() => aboutPhotos.map((_, i) => i))
  const front = (i) => setOrder((o) => [...o.filter((j) => j !== i), i])
  return (
    <Reveal className="photo-stack">
      {aboutPhotos.map((ph, i) => {
        const pose = POSE[i % POSE.length]
        return (
          <motion.figure
            key={ph.src}
            className="sticker"
            style={{ left: `${pose.x}%`, top: `${pose.y}%`, width: `${pose.w}%`, aspectRatio: `${ph.w} / ${ph.h}`, zIndex: order.indexOf(i) + 1 }}
            initial={{ rotate: pose.r * 2.2, scale: 0.9 }}
            whileInView={{ rotate: pose.r, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            whileHover={{ rotate: 0, scale: 1.04, y: -6 }}
            whileDrag={{ scale: 1.08, rotate: pose.r * 0.4, cursor: 'grabbing' }}
            drag
            dragSnapToOrigin
            dragElastic={0.5}
            dragTransition={{ bounceStiffness: 260, bounceDamping: 18 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22, delay: i * 0.08 }}
            onDragStart={() => front(i)}
            onTap={() => front(i)}
          >
            <span className="sticker-back" style={{ clipPath: ph.backing }} aria-hidden="true" />
            <img src={ph.src} alt={ph.alt} loading="lazy" draggable="false" style={ph.clip ? { clipPath: ph.clip } : undefined} />
          </motion.figure>
        )
      })}
    </Reveal>
  )
}

export function About() {
  return (
    <div className="about">
      <div className="about-top">
      <div className="about-bio">
        <Reveal className="about-person">
          <img src={profile.avatar} alt={`${profile.name} avatar`} className="avatar" />
          <div>
            <strong>{profile.name}</strong>
            <span>{profile.location}</span>
          </div>
        </Reveal>
        {profile.bio.map((p, i) => <Reveal key={i} as="p" delay={0.05 * i}>{p}</Reveal>)}
        <Reveal className="skills">
          {skills.map((s) => (
            <div key={s.group} className="skill-group">
              <p>{s.group}</p>
              <div className="tags">{s.items.map((t) => <span key={t}>{t}</span>)}</div>
            </div>
          ))}
        </Reveal>
      </div>
      {aboutPhotos.length > 0 && <PhotoStack />}
      </div>
      <div className="about-cv">
        <div>
          <Reveal as="h3" className="cv-title">Experience</Reveal>
          {experience.map((e, i) => (
            <Reveal key={e.title} delay={0.05 * i} className="cv-item">
              <div className="cv-head"><h4>{e.title}</h4><span>{e.org}</span></div>
              <ul>{e.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </Reveal>
          ))}
        </div>
        <div>
          <Reveal as="h3" className="cv-title">Education</Reveal>
          {education.map((e, i) => (
            <Reveal key={e.school} delay={0.05 * i} className="cv-item">
              <div className="cv-head"><h4>{e.school}</h4><span>{e.dates}</span></div>
              {e.detail && <p className="cv-detail">{e.detail}</p>}
              {e.courses && <div className="tags">{e.courses.map((c) => <span key={c}>{c}</span>)}</div>}
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div className="toast" role="status" initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }}>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Contact({ onToast }) {
  const copy = () => navigator.clipboard?.writeText(profile.email).then(() => onToast('Email copied'), () => onToast(profile.email))
  return (
    <div className="contact">
      <Reveal as="h2" className="contact-title">Let’s build something together.</Reveal>
      <Reveal as="p" delay={0.08} className="section-lede">Open to collaborations, game jams and internships. The fastest way to reach me is email.</Reveal>
      <Reveal delay={0.12} className="links">
        <a className="btn primary" href={`mailto:${profile.email}`}>{profile.email}</a>
        <button className="btn" onClick={copy}>Copy email</button>
        <a className="btn" href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
      </Reveal>
      <footer className="footer">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>Built with React, Three.js and Framer Motion</span>
      </footer>
    </div>
  )
}

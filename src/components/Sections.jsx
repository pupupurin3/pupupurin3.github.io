import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import ModelViewer from './ModelViewer'
import { categories, education, experience, gallery, profile, projects, skills } from '../data/content'

// Fades and lifts children into place the first time they scroll into view.
export function Reveal({ children, delay = 0, className, as = 'div' }) {
  const M = motion[as]
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  )
}

function SectionTitle({ kicker, children }) {
  return (
    <div className="section-title">
      <Reveal><span className="kicker">{kicker}</span></Reveal>
      <Reveal delay={0.05} as="h2">{children}</Reveal>
      <motion.div
        className="title-bar"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
    </div>
  )
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 25 })
  return <motion.div className="scroll-progress" style={{ scaleX }} />
}

const NAV = [
  ['about', 'About'],
  ['projects', 'Projects'],
  ['gallery', '3D'],
  ['experience', 'Experience'],
  ['contact', 'Contact'],
]

export function Nav({ show }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    NAV.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => { window.removeEventListener('scroll', onScroll); io.disconnect() }
  }, [])

  return (
    <motion.nav
      className={`nav ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -80 }}
      animate={show ? { y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.1 }}
    >
      <a href="#home" className="brand">PURIN<span>.dev</span></a>
      <button className="nav-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span /><span /><span />
      </button>
      <ul className={open ? 'open' : ''}>
        {NAV.map(([id, label]) => (
          <li key={id}>
            <a href={`#${id}`} className={active === id ? 'active' : ''} onClick={() => setOpen(false)}>
              {label}
              {active === id && <motion.span layoutId="nav-dot" className="nav-dot" />}
            </a>
          </li>
        ))}
      </ul>
    </motion.nav>
  )
}

function SkillBar({ name, level, i }) {
  return (
    <div className="skill">
      <div className="skill-head"><span>{name}</span><span>{level}%</span></div>
      <div className="skill-track">
        <motion.div
          className="skill-fill"
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

export function About() {
  return (
    <section id="about" className="section">
      <SectionTitle kicker="01 · Profile">About me</SectionTitle>
      <div className="about-grid">
        <Reveal className="card about-card">
          <motion.img
            src={profile.avatar}
            alt={`${profile.name} avatar`}
            className="avatar"
            whileHover={{ rotate: -3, scale: 1.04 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
          <dl className="stats">
            <div><dt>Name</dt><dd>{profile.name}</dd></div>
            <div><dt>Class</dt><dd>Student</dd></div>
            <div><dt>Base</dt><dd>{profile.location}</dd></div>
          </dl>
          <div className="skills">
            {skills.map((s, i) => <SkillBar key={s.name} {...s} i={i} />)}
          </div>
        </Reveal>
        <div className="about-text">
          {profile.bio.map((p, i) => (
            <Reveal key={i} delay={0.1 * i} as="p">{p}</Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Cover for projects that have no screenshot yet: a pixel pattern in the
// project's colour with its initials.
function Cover({ project }) {
  if (project.image) return <img src={project.image} alt="" loading="lazy" />
  const initials = project.title.split(/\s+/).map((w) => w[0]).join('').slice(0, 3)
  return (
    <div className="cover-pattern" style={{ '--c': project.color }}>
      <span>{initials}</span>
    </div>
  )
}

function projectLinks(p) {
  const links = [...(p.links || [])]
  if (p.repo) links.push({ label: 'Source on GitHub', url: `${profile.github}/${p.repo}` })
  return links
}

function ProjectCard({ project, onOpen }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  return (
    <motion.button
      layout
      className="project-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      onClick={() => onOpen(project)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -8, y: ((e.clientX - r.left) / r.width - 0.5) * 8 })
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{ rotateX: tilt.x, rotateY: tilt.y }}
    >
      <motion.div className="project-cover" layoutId={`cover-${project.title}`}>
        <Cover project={project} />
        {project.model && <span className="badge">3D</span>}
      </motion.div>
      <div className="project-body">
        <h3>{project.title}</h3>
        <p className="project-meta">{project.category}{project.status ? ` · ${project.status}` : ''}</p>
        <div className="tags">{project.tags.map((t) => <span key={t}>{t}</span>)}</div>
      </div>
    </motion.button>
  )
}

function ProjectModal({ project, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        {project.model ? (
          <ModelViewer model={project.model} className="modal-media" />
        ) : (
          <motion.div className="project-cover modal-media" layoutId={`cover-${project.title}`}>
            <Cover project={project} />
          </motion.div>
        )}
        <div className="modal-body">
          <h3>{project.title}</h3>
          <p className="project-meta">{project.category}{project.status ? ` · ${project.status}` : ''}</p>
          <p>{project.blurb}</p>
          <div className="tags">{project.tags.map((t) => <span key={t}>{t}</span>)}</div>
          <div className="modal-links">
            {projectLinks(project).map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn primary">{l.label}</a>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Projects() {
  const [filter, setFilter] = useState('All')
  const [open, setOpen] = useState(null)
  const shown = projects.filter((p) => filter === 'All' || p.category === filter || (filter === '3D' && p.model))

  return (
    <section id="projects" className="section">
      <SectionTitle kicker="02 · Quest log">Projects</SectionTitle>
      <Reveal className="filters">
        {categories.map((c) => (
          <button key={c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>
            {filter === c && <motion.span layoutId="filter-pill" className="filter-pill" />}
            <span className="filter-label">{c}</span>
          </button>
        ))}
      </Reveal>
      <motion.div layout className="project-grid">
        <AnimatePresence mode="popLayout">
          {shown.map((p) => <ProjectCard key={p.title} project={p} onOpen={setOpen} />)}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {open && <ProjectModal project={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  )
}

export function Gallery() {
  const [i, setI] = useState(0)
  const item = gallery[i]
  return (
    <section id="gallery" className="section">
      <SectionTitle kicker="03 · Workshop">3D gallery</SectionTitle>
      <Reveal className="gallery">
        <div className="gallery-list">
          {gallery.map((g, idx) => (
            <button key={g.name} className={idx === i ? 'on' : ''} onClick={() => setI(idx)}>
              <span className="gallery-index">{String(idx + 1).padStart(2, '0')}</span>
              <span>
                <strong>{g.name}</strong>
                <small>{g.note}</small>
              </span>
            </button>
          ))}
        </div>
        <ModelViewer model={item.model} className="gallery-viewer" />
      </Reveal>
    </section>
  )
}

export function Experience() {
  return (
    <section id="experience" className="section">
      <SectionTitle kicker="04 · Save file">Experience & education</SectionTitle>
      <div className="timeline">
        {experience.map((e, i) => (
          <Reveal key={e.title} delay={0.1 * i} className="timeline-item">
            <span className="timeline-dot" />
            <h3>{e.title}</h3>
            <p className="project-meta">{e.org}</p>
            <ul>{e.points.map((p) => <li key={p}>{p}</li>)}</ul>
          </Reveal>
        ))}
        {education.map((e, i) => (
          <Reveal key={e.school} delay={0.1 * i} className="timeline-item edu">
            <span className="timeline-dot" />
            <h3>{e.school}</h3>
            <p className="project-meta">{e.dates}{e.detail ? ` · ${e.detail}` : ''}</p>
            {e.courses && <div className="tags">{e.courses.map((c) => <span key={c}>{c}</span>)}</div>}
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Contact() {
  return (
    <section id="contact" className="section contact">
      <SectionTitle kicker="05 · Continue?">Get in touch</SectionTitle>
      <Reveal className="card contact-card">
        <p>Want to team up on a game, or just say hi? My inbox is open.</p>
        <div className="modal-links">
          <motion.a whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }} className="btn primary" href={`mailto:${profile.email}`}>{profile.email}</motion.a>
          <motion.a whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }} className="btn" href={profile.github} target="_blank" rel="noreferrer">GitHub</motion.a>
        </div>
      </Reveal>
      <footer className="footer">© {new Date().getFullYear()} {profile.name} · Built with React & Three.js</footer>
    </section>
  )
}

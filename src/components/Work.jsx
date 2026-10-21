import { useEffect, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import ModelViewer from './ModelViewer'
import { categories, profile, projects } from '../data/content'

const ease = [0.22, 1, 0.36, 1]

function projectLinks(p) {
  const links = [...(p.links || [])]
  if (p.repo) links.push({ label: 'Source on GitHub', url: `${profile.github}/${p.repo}` })
  return links
}

// Cover for projects without a screenshot: a quiet gradient in the project's
// colour with its initials.
function Cover({ project }) {
  if (project.image) return <img src={project.image} alt="" loading="lazy" />
  const initials = project.title.split(/\s+/).map((w) => w[0]).join('').slice(0, 2)
  return (
    <div className="cover-gen" style={{ '--c': project.color }}>
      <span>{initials}</span>
    </div>
  )
}

function Card({ project, onOpen }) {
  const id = project.title
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, ease }}
    >
      <motion.button className="card" data-project={id} layoutId={`card-${id}`} onClick={() => onOpen(project)} whileHover="hover">
        <motion.div className="card-media" layoutId={`media-${id}`}>
          <motion.div className="card-media-inner" variants={{ hover: { scale: 1.04 } }} transition={{ duration: 0.5, ease }}>
            <Cover project={project} />
          </motion.div>
          {project.model && <span className="pill">3D</span>}
        </motion.div>
        <div className="card-body">
          <motion.h3 layoutId={`title-${id}`}>{project.title}</motion.h3>
          <p className="card-meta">{project.category}{project.status ? ` · ${project.status}` : ''}</p>
          <p className="card-blurb">{project.blurb}</p>
        </div>
        <motion.span className="card-arrow" variants={{ hover: { x: 4, opacity: 1 } }} aria-hidden="true">→</motion.span>
      </motion.button>
    </motion.li>
  )
}

// The card expands into this dialog through shared layout ids, so the image
// and title morph from the grid into place.
function Detail({ project, onClose }) {
  const id = project.title
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <>
      <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="detail-wrap" onClick={onClose}>
        <motion.div
          className="detail"
          layoutId={`card-${id}`}
          role="dialog"
          aria-modal="true"
          aria-label={project.title}
          onClick={(e) => e.stopPropagation()}
          transition={{ duration: 0.5, ease }}
        >
          <motion.div className="detail-media" layoutId={`media-${id}`}>
            {project.model ? <ModelViewer model={project.model} /> : <Cover project={project} />}
          </motion.div>
          <div className="detail-body">
            <motion.h3 layoutId={`title-${id}`}>{project.title}</motion.h3>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.2 }}>
              <p className="card-meta">{project.category}{project.status ? ` · ${project.status}` : ''}</p>
              <p>{project.blurb}</p>
              <div className="tags">{project.tags.map((t) => <span key={t}>{t}</span>)}</div>
              <div className="links">
                {projectLinks(project).map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn primary">{l.label} ↗</a>
                ))}
              </div>
            </motion.div>
          </div>
          <button className="icon-btn detail-close" onClick={onClose} aria-label="Close">✕</button>
        </motion.div>
      </div>
    </>
  )
}

export default function Work() {
  const [filter, setFilter] = useState('All')
  const [showAll, setShowAll] = useState(false)
  const [open, setOpen] = useState(null)

  // Other components (the command palette) can open a project by event.
  useEffect(() => {
    const onOpen = (e) => setOpen(projects.find((p) => p.title === e.detail) || null)
    window.addEventListener('open-project', onOpen)
    return () => window.removeEventListener('open-project', onOpen)
  }, [])

  const filtered = projects.filter((p) => filter === 'All' || p.category === filter || (filter === '3D' && p.model))
  const shown = filter === 'All' && !showAll ? filtered.filter((p) => p.featured) : filtered

  return (
    <LayoutGroup>
      <div className="segmented" role="tablist" aria-label="Filter projects">
        {categories.map((c) => (
          <button key={c} role="tab" aria-selected={filter === c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>
            {filter === c && <motion.span layoutId="seg-pill" className="seg-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <span className="label">{c}</span>
          </button>
        ))}
      </div>
      <motion.ul layout className="card-grid">
        <AnimatePresence mode="popLayout">
          {shown.map((p) => <Card key={p.title} project={p} onOpen={setOpen} />)}
        </AnimatePresence>
      </motion.ul>
      {filter === 'All' && (
        <div className="more">
          <button className="btn" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show featured only' : `Show all ${projects.length} projects`}
          </button>
        </div>
      )}
      <AnimatePresence>
        {open && <Detail key={open.title} project={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </LayoutGroup>
  )
}

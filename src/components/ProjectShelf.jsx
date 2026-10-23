import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import ModelViewer from './ModelViewer'
import { Cover, projectLinks } from './Work'
import { categories, projects } from '../data/content'

// One long shelf of project cards that scrolls sideways. Drag it with the
// mouse (it keeps gliding after you let go), swipe it on touch, use the
// arrows or the keyboard. Hovering lifts a card off the shelf; clicking
// grows the card into its details panel. Filtering dims what doesn't match
// and slides the first match into view.

const spring = { type: 'spring', stiffness: 380, damping: 30 }

function ShelfCard({ project, index, dimmed, open, onOpen, wasDrag }) {
  if (open) return <li className="shelf-card-gap" aria-hidden="true" />
  return (
    <motion.li
      className="shelf-item"
      initial={{ opacity: 0, x: 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ ...spring, delay: Math.min(index, 6) * 0.05 }}
    >
      <motion.button
        layoutId={`shelf-${project.title}`}
        className="shelf-card"
        data-project={project.title}
        animate={{ opacity: dimmed ? 0.3 : 1, scale: dimmed ? 0.94 : 1, y: dimmed ? 6 : 0 }}
        whileHover={dimmed ? {} : { y: -12, rotate: -1.2 }}
        whileTap={{ scale: 0.97 }}
        transition={spring}
        onClick={() => !wasDrag() && onOpen(project)}
        aria-label={`${project.title}, ${project.category}`}
      >
        <div className="shelf-card-media"><Cover project={project} /></div>
        <div className="shelf-card-body">
          <span className="shelf-card-kicker"><i style={{ background: project.color }} />{project.category}</span>
          <strong>{project.title}</strong>
          <span className="shelf-card-tags">{project.tags.slice(0, 2).join(' · ')}</span>
        </div>
      </motion.button>
    </motion.li>
  )
}

function ShelfDetail({ project, onClose }) {
  const [showModel, setShowModel] = useState(false)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      {/* The card on the shelf grows into this panel. */}
      <motion.div
        layoutId={`shelf-${project.title}`}
        className="modal shelf-detail"
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        transition={spring}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close shelf-detail-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="shelf-detail-media"><Cover project={project} /></div>
        <motion.div className="modal-body" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="kicker">{project.category}{project.status ? ` · ${project.status}` : ''}</p>
          <h3>{project.title}</h3>
          <p>{project.blurb}</p>
          <div className="tags">{project.tags.map((t) => <span key={t}>{t}</span>)}</div>
          <div className="modal-links">
            {projectLinks(project).map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn primary">↗ {l.label}</a>
            ))}
            {project.model && <button className="btn" onClick={() => setShowModel(!showModel)}>{showModel ? 'Hide' : 'Show'} 3D model</button>}
          </div>
          <AnimatePresence>
            {showModel && (
              <motion.div className="shelf-extra" initial={{ height: 0, opacity: 0 }} animate={{ height: 300, opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <ModelViewer model={project.model} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// Mouse drag-to-scroll with a little momentum, on top of native scrolling
// (touch and trackpads scroll natively).
function useDragScroll(ref) {
  const moved = useRef(0)
  useEffect(() => {
    const el = ref.current
    let down = false, startX = 0, startLeft = 0, lastX = 0, lastT = 0, v = 0, raf = 0
    const glide = () => {
      v *= 0.94
      el.scrollLeft -= v
      if (Math.abs(v) > 0.4) raf = requestAnimationFrame(glide)
      else el.classList.remove('dragging')
    }
    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      cancelAnimationFrame(raf)
      down = true; moved.current = 0
      startX = lastX = e.clientX; startLeft = el.scrollLeft; lastT = performance.now(); v = 0
    }
    const onMove = (e) => {
      if (!down) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 4 && !el.classList.contains('dragging')) el.classList.add('dragging')
      moved.current = Math.max(moved.current, Math.abs(dx))
      el.scrollLeft = startLeft - dx
      const now = performance.now()
      v = ((e.clientX - lastX) / Math.max(now - lastT, 1)) * 16
      lastX = e.clientX; lastT = now
    }
    const onUp = () => {
      if (!down) return
      down = false
      if (Math.abs(v) > 1) raf = requestAnimationFrame(glide)
      else el.classList.remove('dragging')
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [ref])
  // A click at the end of a drag shouldn't open the card under the cursor.
  return () => moved.current > 6
}

export default function ProjectShelf() {
  const [filter, setFilter] = useState('All')
  const [open, setOpen] = useState(null)
  const track = useRef()
  const wasDrag = useDragScroll(track)
  const progress = useMotionValue(0)
  const thumb = useMotionValue(1)
  const smooth = useSpring(progress, { stiffness: 300, damping: 40 })
  const left = useTransform([smooth, thumb], ([p, t]) => `${p * (1 - t) * 100}%`)
  const width = useTransform(thumb, (t) => `${t * 100}%`)
  const [ends, setEnds] = useState({ start: true, end: false })
  const matches = (p) => filter === 'All' || p.category === filter || (filter === '3D' && p.model)
  const count = projects.filter(matches).length

  const onScroll = () => {
    const el = track.current
    const max = el.scrollWidth - el.clientWidth
    progress.set(max > 0 ? el.scrollLeft / max : 0)
    thumb.set(el.scrollWidth ? el.clientWidth / el.scrollWidth : 1)
    setEnds({ start: el.scrollLeft < 4, end: el.scrollLeft > max - 4 })
  }
  useEffect(() => {
    onScroll()
    window.addEventListener('resize', onScroll)
    return () => window.removeEventListener('resize', onScroll)
  }, [])

  // Slide the first matching card into view when the filter changes.
  useEffect(() => {
    const first = projects.find(matches)
    const el = first && track.current?.querySelector(`[data-project="${CSS.escape(first.title)}"]`)
    if (el) track.current.scrollTo({ left: el.parentElement.offsetLeft - 24, behavior: 'smooth' })
  }, [filter])

  const page = (dir) => track.current.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <div className="project-shelf">
      <div className="shelf-bar">
        <div className="filters" role="tablist" aria-label="Filter projects">
          {categories.map((c) => (
            <button key={c} role="tab" aria-selected={filter === c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>
              {filter === c && <motion.span layoutId="filter-pill" className="filter-pill" />}
              <span className="filter-label">{c}</span>
            </button>
          ))}
        </div>
        <div className="shelf-nav">
          <span className="shelf-count">{count} of {projects.length}</span>
          <button className="icon-btn" onClick={() => page(-1)} disabled={ends.start} aria-label="Scroll left">←</button>
          <button className="icon-btn" onClick={() => page(1)} disabled={ends.end} aria-label="Scroll right">→</button>
        </div>
      </div>
      <LayoutGroup id="project-shelf">
        <div className={`shelf-viewport ${ends.start ? 'at-start' : ''} ${ends.end ? 'at-end' : ''}`}>
          <ul
            className="shelf-track"
            ref={track}
            onScroll={onScroll}
            tabIndex={0}
            aria-label="Projects, scroll sideways"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') { e.preventDefault(); page(1) }
              if (e.key === 'ArrowLeft') { e.preventDefault(); page(-1) }
            }}
          >
            {projects.map((p, i) => (
              <ShelfCard key={p.title} project={p} index={i} dimmed={!matches(p)} open={open?.title === p.title} onOpen={setOpen} wasDrag={wasDrag} />
            ))}
          </ul>
          <div className="shelf-plank" aria-hidden="true" />
        </div>
        <div className="shelf-scrollbar" aria-hidden="true">
          <motion.div style={{ left, width }} />
        </div>
        <AnimatePresence>
          {open && <ShelfDetail project={open} onClose={() => setOpen(null)} />}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  )
}

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import ModelViewer from './ModelViewer'
import { categories, profile, projects } from '../data/content'

// Every project is a flat, illustrated book on a wooden shelf. Hovering
// lifts a book and tips it out, clicking pulls it off the shelf: the spine
// morphs into the book's cover in the details panel (a shared layout
// animation). Filtered-out books sink back and fade.

// Deterministic per-title variation, so the shelf looks the same every visit.
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296)
}

function bookLook(title) {
  const r = hash(title)
  return { w: 38 + Math.round(r() * 18), h: 150 + Math.round(r() * 46), style: Math.floor(r() * 3) }
}

const spring = { type: 'spring', stiffness: 380, damping: 26 }

function Book({ project, scale, dimmed, hot, open, onHover, onOpen }) {
  const look = useMemo(() => bookLook(project.title), [project.title])
  const size = { width: Math.round(look.w * scale), height: Math.round(look.h * scale) }
  // While the book is open its spine lives in the details panel, so leave a
  // gap of the same size on the shelf.
  if (open) return <div className="book-gap" style={size} />
  return (
    <motion.button
      layoutId={`book-${project.title}`}
      className={`book book-s${look.style}`}
      style={{ ...size, '--c': project.color }}
      animate={{
        y: hot ? -16 : dimmed ? 8 : 0,
        rotate: hot ? -4 : 0,
        opacity: dimmed ? 0.28 : 1,
        filter: dimmed ? 'saturate(0.2)' : 'saturate(1)',
      }}
      whileTap={{ scale: 0.96 }}
      transition={spring}
      onMouseEnter={() => onHover(project.title)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(project.title)}
      onBlur={() => onHover(null)}
      onClick={() => onOpen(project)}
      aria-label={`${project.title}, ${project.category}`}
    >
      <span className="book-title" style={{ fontSize: Math.min(13, (look.h * 0.68) / (project.title.length * 0.6)) * scale }}>{project.title}</span>
      <span className="book-cat">{project.category.slice(0, 4)}</span>
    </motion.button>
  )
}

function Plant() {
  return (
    <svg className="shelf-plant" viewBox="0 0 80 110" aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeWidth="9">
        <path d="M40 66 C36 44 22 34 14 18" stroke="#3f7a3f" />
        <path d="M40 66 C42 40 50 24 62 10" stroke="#4f8a4b" />
        <path d="M40 66 C40 46 38 30 40 6" stroke="#5a9a55" />
        <path d="M40 66 C30 54 20 52 8 50" stroke="#4f8a4b" />
        <path d="M40 66 C52 54 62 52 74 46" stroke="#3f7a3f" />
      </g>
      <path d="M18 64 H62 L56 108 H24 Z" fill="#d97a54" />
      <rect x="14" y="60" width="52" height="10" rx="2" fill="#c96a46" />
    </svg>
  )
}

// A few books lying flat, to finish off the last shelf.
function Stack() {
  return (
    <div className="shelf-stack" aria-hidden="true">
      <span style={{ '--c': '#8a6a9a', width: 92 }} />
      <span style={{ '--c': '#c9a24a', width: 104 }} />
      <span style={{ '--c': '#4f7a8a', width: 98 }} />
    </div>
  )
}

const PLANT_W = 90
const STACK_W = 120

// Splits the books into as few shelves as fit the case width, then evens
// the shelves out so none is left nearly empty. The plant takes room on the
// top shelf and the stack on the bottom one.
function useRows(ref) {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref])
  return useMemo(() => {
    // Smaller books on phones so a shelf holds more of them.
    const scale = width && width < 480 ? 0.8 : 1
    if (!width) return { rows: [projects], scale }
    const books = projects.map((p) => bookLook(p.title).w * scale + 3)
    const fits = (rows) => rows.every((r, i) => {
      const extra = ((i === 0 ? PLANT_W : 0) + (i === rows.length - 1 && rows.length > 1 ? STACK_W : 0)) * scale
      return r.reduce((a, j) => a + books[j], 0) + extra <= width
    })
    for (let n = 1; n <= projects.length; n++) {
      const per = Math.ceil(projects.length / n)
      const idx = Array.from({ length: n }, (_, r) => projects.map((_, j) => j).slice(r * per, (r + 1) * per)).filter((r) => r.length)
      if (fits(idx) || n === projects.length) return { rows: idx.map((r) => r.map((j) => projects[j])), scale }
    }
  }, [width])
}

function projectLinks(p) {
  const links = [...(p.links || [])]
  if (p.repo) links.push({ label: 'Source on GitHub', url: `${profile.github}/${p.repo}` })
  return links
}

function BookDetail({ project, onClose }) {
  const tabs = [project.image && 'Screenshot', project.model && '3D model'].filter(Boolean)
  const [tab, setTab] = useState(null)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal book-detail"
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={spring}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close book-close" onClick={onClose} aria-label="Close">✕</button>
        {/* The spine from the shelf morphs into this cover. */}
        <motion.div layoutId={`book-${project.title}`} className="book-cover" style={{ '--c': project.color }} transition={spring}>
          {project.image && <img src={project.image} alt="" />}
          <strong>{project.title}</strong>
          <small>{project.category}{project.status ? ` · ${project.status}` : ''}</small>
        </motion.div>
        <div className="book-detail-body">
          <p className="kicker">{project.category}{project.status ? ` · ${project.status}` : ''}</p>
          <h3>{project.title}</h3>
          <p>{project.blurb}</p>
          <div className="tags">{project.tags.map((t) => <span key={t}>{t}</span>)}</div>
          <div className="modal-links">
            {projectLinks(project).map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn primary">↗ {l.label}</a>
            ))}
            {tabs.map((t) => (
              <button key={t} className="btn" onClick={() => setTab(tab === t ? null : t)}>{tab === t ? 'Hide' : 'Show'} {t.toLowerCase()}</button>
            ))}
          </div>
          <AnimatePresence>
            {tab && (
              <motion.div className="book-extra" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                {tab === 'Screenshot' && <img src={project.image} alt={`${project.title} screenshot`} />}
                {tab === '3D model' && <ModelViewer model={project.model} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function BookShelf() {
  const [filter, setFilter] = useState('All')
  const [hovered, setHovered] = useState(null)
  const [open, setOpen] = useState(null)
  const matches = (p) => filter === 'All' || p.category === filter || (filter === '3D' && p.model)
  const count = useMemo(() => projects.filter(matches).length, [filter])
  const rowsRef = useRef()
  const { rows, scale } = useRows(rowsRef)

  return (
    <div className="book-shop">
      <div className="filters" role="tablist" aria-label="Filter projects">
        {categories.map((c) => (
          <button key={c} role="tab" aria-selected={filter === c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>
            {filter === c && <motion.span layoutId="filter-pill" className="filter-pill" />}
            <span className="filter-label">{c}</span>
          </button>
        ))}
      </div>
      <LayoutGroup id="bookshelf">
        <div className="shop-grid">
          <div className="bookcase">
            <div className="shelf-sign">{count} of {projects.length} books</div>
            <div className="shelf-rows" ref={rowsRef}>
              {rows.map((row, r) => (
                <div className="shelf-row" key={r}>
                  {row.map((p) => (
                    <motion.div
                      key={p.title}
                      className="book-slot"
                      initial={{ y: -40, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ ...spring, delay: projects.indexOf(p) * 0.04 }}
                    >
                      <Book
                        project={p}
                        scale={scale}
                        dimmed={!matches(p)}
                        hot={hovered === p.title}
                        open={open?.title === p.title}
                        onHover={setHovered}
                        onOpen={setOpen}
                      />
                    </motion.div>
                  ))}
                  {r === 0 && <Plant />}
                  {r === rows.length - 1 && rows.length > 1 && <Stack />}
                </div>
              ))}
            </div>
          </div>
          <ol className="tracklist" aria-label="Project list">
            {projects.map((p, i) => (
              <li key={p.title} className={`${matches(p) ? '' : 'out'} ${hovered === p.title ? 'hot' : ''}`}>
                <button
                  onMouseEnter={() => setHovered(p.title)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(p.title)}
                  onBlur={() => setHovered(null)}
                  onClick={() => setOpen(p)}
                >
                  <span className="track-no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="track-title">{p.title}</span>
                  <span className="track-cat" style={{ background: p.color }}>{p.category}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <AnimatePresence>
          {open && <BookDetail project={open} onClose={() => setOpen(null)} />}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  )
}

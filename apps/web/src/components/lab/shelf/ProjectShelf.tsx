import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { FILTERS, matchesFilter, projects, type Filter, type Project } from '../../../content/projects'
import { useDragScroll } from '../../../hooks/useDragScroll'
import { ShelfCard } from './ShelfCard'
import { ShelfDetail } from './ShelfDetail'

// One long shelf of project cards that scrolls sideways. Drag it with the
// mouse (it keeps gliding after you let go), swipe it on touch, use the
// arrows or the keyboard. Hovering lifts a card off the shelf; clicking
// grows the card into its details panel. Filtering dims what doesn't match
// and slides the first match into view.

export function ProjectShelf() {
  const [filter, setFilter] = useState<Filter>('All')
  const [open, setOpen] = useState<Project | null>(null)
  const close = useCallback(() => setOpen(null), [])
  const track = useRef<HTMLUListElement>(null)
  const wasDrag = useDragScroll(track)
  const progress = useMotionValue(0)
  const thumb = useMotionValue(1)
  const smooth = useSpring(progress, { stiffness: 300, damping: 40 })
  const left = useTransform([smooth, thumb], ([p, t]: number[]) => `${p! * (1 - t!) * 100}%`)
  const width = useTransform(thumb, (t) => `${t * 100}%`)
  const [ends, setEnds] = useState({ start: true, end: false })
  const count = projects.filter((p) => matchesFilter(p, filter)).length

  const onScroll = useCallback(() => {
    const el = track.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    progress.set(max > 0 ? el.scrollLeft / max : 0)
    thumb.set(el.scrollWidth ? el.clientWidth / el.scrollWidth : 1)
    setEnds({ start: el.scrollLeft < 4, end: el.scrollLeft > max - 4 })
  }, [progress, thumb])

  useEffect(() => {
    onScroll()
    window.addEventListener('resize', onScroll)
    return () => window.removeEventListener('resize', onScroll)
  }, [onScroll])

  // Slide the first matching card into view when the filter changes.
  useEffect(() => {
    const first = projects.find((p) => matchesFilter(p, filter))
    const el = first && track.current?.querySelector<HTMLElement>(`[data-project="${CSS.escape(first.slug)}"]`)
    if (el?.parentElement) track.current!.scrollTo({ left: el.parentElement.offsetLeft - 24, behavior: 'smooth' })
  }, [filter])

  const page = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <div className="project-shelf">
      <div className="shelf-bar">
        <div className="filters" role="tablist" aria-label="Filter projects">
          {FILTERS.map((c) => (
            <button key={c} role="tab" aria-selected={filter === c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>
              {filter === c && <motion.span layoutId="filter-pill" className="filter-pill" />}
              <span className="filter-label">{c}</span>
            </button>
          ))}
        </div>
        <div className="shelf-nav">
          <span className="shelf-count">
            {count} of {projects.length}
          </span>
          <button className="icon-btn" onClick={() => page(-1)} disabled={ends.start} aria-label="Scroll left">
            ←
          </button>
          <button className="icon-btn" onClick={() => page(1)} disabled={ends.end} aria-label="Scroll right">
            →
          </button>
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
              if (e.key === 'ArrowRight') {
                e.preventDefault()
                page(1)
              }
              if (e.key === 'ArrowLeft') {
                e.preventDefault()
                page(-1)
              }
            }}
          >
            {projects.map((p, i) => (
              <ShelfCard
                key={p.slug}
                project={p}
                index={i}
                dimmed={!matchesFilter(p, filter)}
                open={open?.slug === p.slug}
                onOpen={setOpen}
                wasDrag={wasDrag}
              />
            ))}
          </ul>
          <div className="shelf-plank" aria-hidden="true" />
        </div>
        <div className="shelf-scrollbar" aria-hidden="true">
          <motion.div style={{ left, width }} />
        </div>
        <AnimatePresence>{open && <ShelfDetail project={open} onClose={close} />}</AnimatePresence>
      </LayoutGroup>
    </div>
  )
}

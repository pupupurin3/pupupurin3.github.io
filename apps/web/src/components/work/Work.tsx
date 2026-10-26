import { useCallback, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { FILTERS, findProject, matchesFilter, projects, type Filter, type Project } from '../../content/projects'
import { useSiteEvent } from '../../hooks/useSiteEvent'
import { ProjectCard } from './ProjectCard'
import { ProjectDetail } from './ProjectDetail'

/** Which cards the grid shows: featured ones under "All" until expanded. */
export function visibleProjects(filter: Filter, showAll: boolean): Project[] {
  const filtered = projects.filter((p) => matchesFilter(p, filter))
  return filter === 'All' && !showAll ? filtered.filter((p) => p.featured) : filtered
}

export function Work() {
  const [filter, setFilter] = useState<Filter>('All')
  const [showAll, setShowAll] = useState(false)
  const [open, setOpen] = useState<Project | null>(null)
  const close = useCallback(() => setOpen(null), [])

  // The command palette and the platformer open projects by slug.
  useSiteEvent('open-project', (slug) => setOpen(findProject(slug) ?? null))

  const shown = visibleProjects(filter, showAll)

  return (
    <LayoutGroup>
      <div className="segmented" role="tablist" aria-label="Filter projects">
        {FILTERS.map((c) => (
          <button key={c} role="tab" aria-selected={filter === c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>
            {filter === c && <motion.span layoutId="seg-pill" className="seg-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <span className="label">{c}</span>
          </button>
        ))}
      </div>
      <motion.ul layout className="card-grid">
        <AnimatePresence mode="popLayout">
          {shown.map((p) => (
            <ProjectCard key={p.slug} project={p} onOpen={setOpen} />
          ))}
        </AnimatePresence>
      </motion.ul>
      {filter === 'All' && (
        <div className="more">
          <button className="btn" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show featured only' : `Show all ${projects.length} projects`}
          </button>
        </div>
      )}
      <AnimatePresence>{open && <ProjectDetail key={open.slug} project={open} onClose={close} />}</AnimatePresence>
    </LayoutGroup>
  )
}

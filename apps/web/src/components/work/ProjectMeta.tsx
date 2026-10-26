import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { projectLinks } from '@portfolio/shared'
import type { Project } from '../../content/projects'
import { useProjectStats } from '../../hooks/projectStats'

/** "Games · Nov 2023" */
export const projectKicker = (p: Project) => `${p.category}${p.status ? ` · ${p.status}` : ''}`

/** Outbound links for a project's detail view. */
export function ProjectLinks({ project, arrow = 'after' }: { project: Project; arrow?: 'before' | 'after' }) {
  return projectLinks(project).map((l) => (
    <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn primary">
      {arrow === 'before' ? `↗ ${l.label}` : `${l.label} ↗`}
    </a>
  ))
}

/**
 * Like button and view count for an open project. Counts the view when it
 * mounts. Renders nothing until the API has answered (or without an API).
 */
export function ProjectStatsBar({ slug }: { slug: string }) {
  const { stats, toggleLike, recordView } = useProjectStats(slug)
  useEffect(() => recordView(), [slug]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!stats) return null
  return (
    <div className="project-stats">
      <motion.button
        className={`like-btn ${stats.liked ? 'on' : ''}`}
        onClick={toggleLike}
        aria-pressed={stats.liked}
        aria-label={stats.liked ? 'Unlike this project' : 'Like this project'}
        whileTap={{ scale: 0.88 }}
      >
        <motion.span key={String(stats.liked)} initial={{ scale: stats.liked ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }} aria-hidden="true">
          {stats.liked ? '♥' : '♡'}
        </motion.span>
        {stats.likes}
      </motion.button>
      <span className="view-count">
        {stats.views} {stats.views === 1 ? 'view' : 'views'}
      </span>
    </div>
  )
}

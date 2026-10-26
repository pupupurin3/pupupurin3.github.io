import { motion } from 'framer-motion'
import type { Project } from '../../../content/projects'
import { Cover } from '../../work/Cover'
import { shelfSpring } from './spring'

interface ShelfCardProps {
  project: Project
  index: number
  dimmed: boolean
  open: boolean
  onOpen: (project: Project) => void
  wasDrag: () => boolean
}

export function ShelfCard({ project, index, dimmed, open, onOpen, wasDrag }: ShelfCardProps) {
  // While open, the card lives in the detail panel; keep its slot on the shelf.
  if (open) return <li className="shelf-card-gap" aria-hidden="true" />
  return (
    <motion.li
      className="shelf-item"
      initial={{ opacity: 0, x: 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ ...shelfSpring, delay: Math.min(index, 6) * 0.05 }}
    >
      <motion.button
        layoutId={`shelf-${project.slug}`}
        className="shelf-card"
        data-project={project.slug}
        animate={{ opacity: dimmed ? 0.3 : 1, scale: dimmed ? 0.94 : 1, y: dimmed ? 6 : 0 }}
        whileHover={dimmed ? {} : { y: -12, rotate: -1.2 }}
        whileTap={{ scale: 0.97 }}
        transition={shelfSpring}
        onClick={() => !wasDrag() && onOpen(project)}
        aria-label={`${project.title}, ${project.category}`}
      >
        <div className="shelf-card-media">
          <Cover project={project} />
        </div>
        <div className="shelf-card-body">
          <span className="shelf-card-kicker">
            <i style={{ background: project.color }} />
            {project.category}
          </span>
          <strong>{project.title}</strong>
          <span className="shelf-card-tags">{project.tags.slice(0, 2).join(' · ')}</span>
        </div>
      </motion.button>
    </motion.li>
  )
}

import { motion } from 'framer-motion'
import type { Project } from '../../content/projects'
import { ease } from '../../lib/motion'
import { Cover } from './Cover'
import { projectKicker } from './ProjectMeta'

interface ProjectCardProps {
  project: Project
  onOpen: (project: Project) => void
}

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  const id = project.slug
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, ease }}
    >
      {/* data-project lets the platformer open the card Purin stands on. */}
      <motion.button className="card" data-project={id} layoutId={`card-${id}`} onClick={() => onOpen(project)} whileHover="hover">
        <motion.div className="card-media" layoutId={`media-${id}`}>
          <motion.div className="card-media-inner" variants={{ hover: { scale: 1.04 } }} transition={{ duration: 0.5, ease }}>
            <Cover project={project} />
          </motion.div>
          {project.model && <span className="pill">3D</span>}
        </motion.div>
        <div className="card-body">
          <motion.h3 layoutId={`title-${id}`}>{project.title}</motion.h3>
          <p className="card-meta">{projectKicker(project)}</p>
          <p className="card-blurb">{project.blurb}</p>
        </div>
        <motion.span className="card-arrow" variants={{ hover: { x: 4, opacity: 1 } }} aria-hidden="true">
          →
        </motion.span>
      </motion.button>
    </motion.li>
  )
}

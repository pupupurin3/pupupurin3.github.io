import { motion } from 'framer-motion'
import type { Project } from '../../content/projects'
import { useModal } from '../../hooks/useModal'
import { ease } from '../../lib/motion'
import { ModelViewer } from '../three/LazyModelViewer'
import { Tags } from '../ui/Tags'
import { Cover } from './Cover'
import { ProjectLinks, ProjectStatsBar, projectKicker } from './ProjectMeta'

// The card expands into this dialog through shared layout ids, so the image
// and title morph from the grid into place.
export function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const id = project.slug
  useModal(onClose)

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
              <p className="card-meta">{projectKicker(project)}</p>
              <p>{project.blurb}</p>
              <Tags items={project.tags} />
              <div className="links">
                <ProjectLinks project={project} />
              </div>
              <ProjectStatsBar slug={project.slug} />
            </motion.div>
          </div>
          <button className="icon-btn detail-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </motion.div>
      </div>
    </>
  )
}

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Project } from '../../../content/projects'
import { useModal } from '../../../hooks/useModal'
import { ModelViewer } from '../../three/LazyModelViewer'
import { Tags } from '../../ui/Tags'
import { Cover } from '../../work/Cover'
import { ProjectLinks, ProjectStatsBar, projectKicker } from '../../work/ProjectMeta'
import { shelfSpring } from './spring'

export function ShelfDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const [showModel, setShowModel] = useState(false)
  useModal(onClose)

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      {/* The card on the shelf grows into this panel. */}
      <motion.div
        layoutId={`shelf-${project.slug}`}
        className="modal shelf-detail"
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        transition={shelfSpring}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close shelf-detail-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="shelf-detail-media">
          <Cover project={project} />
        </div>
        <motion.div className="modal-body" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="kicker">{projectKicker(project)}</p>
          <h3>{project.title}</h3>
          <p>{project.blurb}</p>
          <Tags items={project.tags} />
          <div className="modal-links">
            <ProjectLinks project={project} arrow="before" />
            {project.model && (
              <button className="btn" onClick={() => setShowModel(!showModel)}>
                {showModel ? 'Hide' : 'Show'} 3D model
              </button>
            )}
          </div>
          <ProjectStatsBar slug={project.slug} />
          <AnimatePresence>
            {showModel && project.model && (
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

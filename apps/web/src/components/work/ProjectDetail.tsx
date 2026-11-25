import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
  const [shot, setShot] = useState(0)
  const gallery = project.gallery ?? []

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
            {project.model ? (
              <ModelViewer model={project.model} />
            ) : project.video ? (
              <iframe
                className="detail-video"
                src={`https://www.youtube-nocookie.com/embed/${project.video}?rel=0&playsinline=1`}
                title={`${project.title} video`}
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                loading="lazy"
              />
            ) : gallery.length ? (
              <AnimatePresence initial={false} mode="popLayout">
                <motion.img key={shot} className="detail-shot" src={gallery[shot]!.src} alt={gallery[shot]!.alt} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
              </AnimatePresence>
            ) : (
              <Cover project={project} />
            )}
          </motion.div>
          {gallery.length > 1 && (
            <div className="detail-thumbs" role="tablist" aria-label="Screenshots">
              {gallery.map((g, i) => (
                <button key={g.src} role="tab" aria-selected={i === shot} aria-label={g.alt} className={i === shot ? 'on' : ''} onClick={() => setShot(i)}>
                  <img src={g.src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
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

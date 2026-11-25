import type { Project } from '../../content/projects'

/** A project's screenshot, its video's thumbnail, or a quiet gradient in its colour with its initials. */
export function Cover({ project }: { project: Project }) {
  if (project.image) return <img src={project.image} alt="" loading="lazy" />
  if (project.video) return <img className="cover-video" src={`https://i.ytimg.com/vi/${project.video}/hqdefault.jpg`} alt="" loading="lazy" />
  const initials = project.title
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
  return (
    <div className="cover-gen" style={{ '--c': project.color } as React.CSSProperties}>
      <span>{initials}</span>
    </div>
  )
}

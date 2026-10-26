import { CATEGORIES, projects as catalogue, type Project } from '@portfolio/shared'
import { asset } from '../lib/asset'

export type { Project }

/** Built-in procedural models; anything else in `model` is a .glb path. */
export const BUILT_IN_MODELS = ['purin', 'mars', 'maze'] as const

const resolveModel = (m: string) => ((BUILT_IN_MODELS as readonly string[]).includes(m) ? m : asset(m))

/** The shared catalogue with image and model paths resolved for this build. */
export const projects: Project[] = catalogue.map((p: Project) => ({
  ...p,
  ...(p.image && { image: asset(p.image) }),
  ...(p.model && { model: resolveModel(p.model) }),
}))

export const FILTERS = ['All', ...CATEGORIES] as const
export type Filter = (typeof FILTERS)[number]

/** "3D" also matches any project with a 3D model, whatever its category. */
export const matchesFilter = (p: Project, filter: Filter) =>
  filter === 'All' || p.category === filter || (filter === '3D' && !!p.model)

export const findProject = (slug: string) => projects.find((p) => p.slug === slug)

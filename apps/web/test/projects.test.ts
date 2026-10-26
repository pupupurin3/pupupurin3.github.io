import { describe, expect, it } from 'vitest'
import { visibleProjects } from '../src/components/work/Work'
import { findProject, matchesFilter, projects } from '../src/content/projects'

describe('project filters', () => {
  it('shows featured projects under All until expanded', () => {
    expect(visibleProjects('All', false).every((p) => p.featured)).toBe(true)
    expect(visibleProjects('All', true)).toHaveLength(projects.length)
  })

  it('treats any project with a model as 3D', () => {
    const mars = findProject('mars-simulation')!
    expect(mars.category).toBe('Simulations')
    expect(matchesFilter(mars, '3D')).toBe(true)
    expect(matchesFilter(mars, 'Games')).toBe(false)
  })

  it('resolves image paths against the base URL', () => {
    expect(findProject('carpe-diem')!.image).toBe('/img/carpe-diem.jpg')
    expect(findProject('3d-maze-maker')!.model).toBe('maze')
  })
})

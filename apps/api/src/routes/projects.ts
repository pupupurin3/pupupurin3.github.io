import { createRoute, z } from '@hono/zod-openapi'
import { ProjectList, ProjectStats, ProjectWithStats, projects } from '@portfolio/shared'
import { notFound } from '../lib/errors'
import { createRouter, json, problems } from '../lib/openapi'
import { MINUTE, utcDay } from '../lib/time'
import { visitorId } from '../lib/visitor'
import { rateLimit } from '../middleware/rateLimit'

const SlugParam = z.object({ slug: z.string().max(64).meta({ example: 'hanafuda' }) })

function findProject(slug: string) {
  const project = projects.find((p) => p.slug === slug)
  if (!project) throw notFound(`There is no project called "${slug}".`)
  return project
}

const list = createRoute({
  method: 'get',
  path: '/',
  tags: ['Projects'],
  summary: 'List every project with its view and like counts',
  responses: { 200: { description: 'All projects, in display order', content: json(ProjectList) } },
})

const get = createRoute({
  method: 'get',
  path: '/{slug}',
  tags: ['Projects'],
  summary: 'Get one project with its counts',
  request: { params: SlugParam },
  responses: { 200: { description: 'The project', content: json(ProjectWithStats) }, ...problems(404) },
})

const view = createRoute({
  method: 'post',
  path: '/{slug}/views',
  tags: ['Projects'],
  summary: 'Count a view',
  description: 'Counts at most one view per visitor, project and UTC day.',
  request: { params: SlugParam },
  middleware: [rateLimit({ name: 'views', limit: 120, windowMs: MINUTE })] as const,
  responses: { 204: { description: 'Recorded (or already counted today)' }, ...problems(404, 429) },
})

const like = createRoute({
  method: 'put',
  path: '/{slug}/like',
  tags: ['Projects'],
  summary: 'Like a project',
  description: 'Idempotent: liking twice counts once.',
  request: { params: SlugParam },
  middleware: [rateLimit({ name: 'likes', limit: 30, windowMs: MINUTE })] as const,
  responses: { 200: { description: 'Updated counts', content: json(ProjectStats) }, ...problems(404, 429) },
})

const unlike = createRoute({
  method: 'delete',
  path: '/{slug}/like',
  tags: ['Projects'],
  summary: 'Take back a like',
  request: { params: SlugParam },
  middleware: [rateLimit({ name: 'likes', limit: 30, windowMs: MINUTE })] as const,
  responses: { 200: { description: 'Updated counts', content: json(ProjectStats) }, ...problems(404, 429) },
})

export const projectRoutes = createRouter()
  .openapi(list, async (c) => {
    const { counts, liked } = await c.var.repos.projects.allStats(await visitorId(c))
    c.header('Cache-Control', 'no-store')
    return c.json(
      {
        projects: projects.map((p) => ({
          ...p,
          stats: { views: 0, likes: 0, ...counts.get(p.slug), liked: liked.has(p.slug) },
        })),
      },
      200,
    )
  })
  .openapi(get, async (c) => {
    const project = findProject(c.req.valid('param').slug)
    const stats = await c.var.repos.projects.stats(project.slug, await visitorId(c))
    c.header('Cache-Control', 'no-store')
    return c.json({ ...project, stats }, 200)
  })
  .openapi(view, async (c) => {
    const { slug } = findProject(c.req.valid('param').slug)
    await c.var.repos.projects.recordView(slug, await visitorId(c), utcDay(Date.now()))
    return c.body(null, 204)
  })
  .openapi(like, async (c) => {
    const { slug } = findProject(c.req.valid('param').slug)
    const visitor = await visitorId(c)
    await c.var.repos.projects.like(slug, visitor, Date.now())
    return c.json(await c.var.repos.projects.stats(slug, visitor), 200)
  })
  .openapi(unlike, async (c) => {
    const { slug } = findProject(c.req.valid('param').slug)
    const visitor = await visitorId(c)
    await c.var.repos.projects.unlike(slug, visitor)
    return c.json(await c.var.repos.projects.stats(slug, visitor), 200)
  })

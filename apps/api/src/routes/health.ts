import { createRoute, z } from '@hono/zod-openapi'
import { createRouter, json } from '../lib/openapi'

const Health = z.object({ status: z.enum(['ok', 'degraded']), database: z.enum(['ok', 'error']) })

const health = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Meta'],
  summary: 'Check that the API and its database are up',
  responses: {
    200: { description: 'Healthy', content: json(Health) },
    503: { description: 'The database is unreachable', content: json(Health) },
  },
})

export const healthRoutes = createRouter().openapi(health, async (c) => {
  c.header('Cache-Control', 'no-store')
  try {
    await c.env.DB.prepare('SELECT 1').first()
    return c.json({ status: 'ok' as const, database: 'ok' as const }, 200)
  } catch (err) {
    console.error(JSON.stringify({ event: 'health_db_error', error: String(err), requestId: c.var.requestId }))
    return c.json({ status: 'degraded' as const, database: 'error' as const }, 503)
  }
})

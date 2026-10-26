import { createRoute, z } from '@hono/zod-openapi'
import { Accepted, GuestbookEntryInput, GuestbookPage } from '@portfolio/shared'
import { createRouter, json, problems } from '../lib/openapi'
import { HOUR, iso } from '../lib/time'
import { visitorId } from '../lib/visitor'
import { rateLimit } from '../middleware/rateLimit'
import { notify } from '../services/notify'

const PageQuery = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

const list = createRoute({
  method: 'get',
  path: '/',
  tags: ['Guestbook'],
  summary: 'List approved guestbook entries, newest first',
  request: { query: PageQuery },
  responses: { 200: { description: 'A page of entries', content: json(GuestbookPage) }, ...problems(400) },
})

const sign = createRoute({
  method: 'post',
  path: '/',
  tags: ['Guestbook'],
  summary: 'Sign the guestbook',
  description: 'New entries wait for moderation and appear once approved.',
  request: { body: { content: json(GuestbookEntryInput), required: true } },
  middleware: [rateLimit({ name: 'guestbook', limit: 5, windowMs: HOUR })] as const,
  responses: { 202: { description: 'Received, awaiting approval', content: json(Accepted) }, ...problems(400, 413, 429) },
})

export const guestbookRoutes = createRouter()
  .openapi(list, async (c) => {
    const { cursor, limit } = c.req.valid('query')
    // One extra row tells us whether there is another page.
    const rows = await c.var.repos.guestbook.listApproved(limit + 1, cursor)
    const page = rows.slice(0, limit)
    c.header('Cache-Control', 'public, max-age=30')
    return c.json(
      {
        entries: page.map((r) => ({ id: r.id, name: r.name, message: r.message, createdAt: iso(r.created_at) })),
        nextCursor: rows.length > limit ? page[page.length - 1]!.id : null,
      },
      200,
    )
  })
  .openapi(sign, async (c) => {
    const { name, message, website } = c.req.valid('json')
    // Filled honeypot: answer like a success so the bot learns nothing.
    if (website) return c.json({ status: 'pending' as const }, 202)
    const id = await c.var.repos.guestbook.create({ name, message, visitor: await visitorId(c), now: Date.now() })
    notify(c, `New guestbook entry #${id} from ${name} is waiting for approval:\n> ${message}`)
    return c.json({ status: 'pending' as const }, 202)
  })

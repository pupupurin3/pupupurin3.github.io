import { createRoute, z } from '@hono/zod-openapi'
import { createRouter, json, problems } from '../lib/openapi'
import { notFound } from '../lib/errors'
import { iso } from '../lib/time'
import { requireAdmin } from '../middleware/admin'
import type { GuestbookRow } from '../repositories/guestbook'

const Status = z.enum(['pending', 'approved', 'rejected'])

const AdminEntry = z
  .object({
    id: z.number().int(),
    name: z.string(),
    message: z.string(),
    status: Status,
    createdAt: z.string(),
    reviewedAt: z.string().nullable(),
  })
  .meta({ id: 'AdminGuestbookEntry' })

const AdminMessage = z
  .object({ id: z.number().int(), name: z.string(), email: z.string(), message: z.string(), createdAt: z.string() })
  .meta({ id: 'ContactMessage' })

const toEntry = (r: GuestbookRow) => ({
  id: r.id,
  name: r.name,
  message: r.message,
  status: r.status,
  createdAt: iso(r.created_at),
  reviewedAt: r.reviewed_at === null ? null : iso(r.reviewed_at),
})

const security = [{ bearerAuth: [] }]
const IdParam = z.object({ id: z.coerce.number().int().positive() })

const listEntries = createRoute({
  method: 'get',
  path: '/guestbook',
  tags: ['Admin'],
  summary: 'List guestbook entries by status',
  security,
  request: {
    query: z.object({ status: Status.default('pending'), limit: z.coerce.number().int().min(1).max(100).default(50) }),
  },
  responses: { 200: { description: 'Entries', content: json(z.object({ entries: z.array(AdminEntry) })) }, ...problems(400, 401) },
})

const review = createRoute({
  method: 'patch',
  path: '/guestbook/{id}',
  tags: ['Admin'],
  summary: 'Approve or reject an entry',
  security,
  request: {
    params: IdParam,
    body: { content: json(z.object({ status: z.enum(['approved', 'rejected']) })), required: true },
  },
  responses: { 200: { description: 'The updated entry', content: json(AdminEntry) }, ...problems(400, 401, 404) },
})

const removeEntry = createRoute({
  method: 'delete',
  path: '/guestbook/{id}',
  tags: ['Admin'],
  summary: 'Delete an entry',
  security,
  request: { params: IdParam },
  responses: { 204: { description: 'Deleted' }, ...problems(401, 404) },
})

const listMessages = createRoute({
  method: 'get',
  path: '/messages',
  tags: ['Admin'],
  summary: 'Read contact messages, newest first',
  security,
  request: {
    query: z.object({
      cursor: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    }),
  },
  responses: {
    200: {
      description: 'A page of messages',
      content: json(z.object({ messages: z.array(AdminMessage), nextCursor: z.number().int().nullable() })),
    },
    ...problems(400, 401),
  },
})

const removeRun = createRoute({
  method: 'delete',
  path: '/game/runs/{runId}',
  tags: ['Admin'],
  summary: 'Remove a run from the leaderboard',
  security,
  request: { params: z.object({ runId: z.uuid() }) },
  responses: { 204: { description: 'Deleted' }, ...problems(400, 401, 404) },
})

const router = createRouter()
router.use('*', requireAdmin)

export const adminRoutes = router
  .openapi(listEntries, async (c) => {
    const { status, limit } = c.req.valid('query')
    const rows = await c.var.repos.guestbook.listByStatus(status, limit)
    return c.json({ entries: rows.map(toEntry) }, 200)
  })
  .openapi(review, async (c) => {
    const row = await c.var.repos.guestbook.setStatus(c.req.valid('param').id, c.req.valid('json').status, Date.now())
    if (!row) throw notFound('There is no such entry.')
    return c.json(toEntry(row), 200)
  })
  .openapi(removeEntry, async (c) => {
    if (!(await c.var.repos.guestbook.remove(c.req.valid('param').id))) throw notFound('There is no such entry.')
    return c.body(null, 204)
  })
  .openapi(listMessages, async (c) => {
    const { cursor, limit } = c.req.valid('query')
    const rows = await c.var.repos.messages.list(limit + 1, cursor)
    const page = rows.slice(0, limit)
    return c.json(
      {
        messages: page.map((m) => ({ id: m.id, name: m.name, email: m.email, message: m.message, createdAt: iso(m.created_at) })),
        nextCursor: rows.length > limit ? page[page.length - 1]!.id : null,
      },
      200,
    )
  })
  .openapi(removeRun, async (c) => {
    if (!(await c.var.repos.runs.remove(c.req.valid('param').runId))) throw notFound('There is no such run.')
    return c.body(null, 204)
  })

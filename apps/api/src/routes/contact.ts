import { createRoute } from '@hono/zod-openapi'
import { Accepted, ContactInput } from '@portfolio/shared'
import { createRouter, json, problems } from '../lib/openapi'
import { HOUR } from '../lib/time'
import { visitorId } from '../lib/visitor'
import { rateLimit } from '../middleware/rateLimit'
import { notify } from '../services/notify'

const send = createRoute({
  method: 'post',
  path: '/',
  tags: ['Contact'],
  summary: 'Send Noah a message',
  request: { body: { content: json(ContactInput), required: true } },
  middleware: [rateLimit({ name: 'contact', limit: 5, windowMs: HOUR })] as const,
  responses: { 202: { description: 'Received', content: json(Accepted) }, ...problems(400, 413, 429) },
})

export const contactRoutes = createRouter().openapi(send, async (c) => {
  const { name, email, message, website } = c.req.valid('json')
  if (website) return c.json({ status: 'received' as const }, 202)
  const id = await c.var.repos.messages.create({ name, email, message, visitor: await visitorId(c), now: Date.now() })
  notify(c, `New message #${id} from ${name} <${email}>:\n> ${message.slice(0, 500)}`)
  return c.json({ status: 'received' as const }, 202)
})

import { HTTPException } from 'hono/http-exception'
import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import type { Context } from 'hono'
import type { AppEnv } from './env'
import { ApiError, problemResponse } from './lib/errors'
import { createRouter } from './lib/openapi'
import { requestContext } from './middleware/context'
import { adminRoutes } from './routes/admin'
import { contactRoutes } from './routes/contact'
import { docsRoutes } from './routes/docs'
import { gameRoutes } from './routes/game'
import { guestbookRoutes } from './routes/guestbook'
import { healthRoutes } from './routes/health'
import { projectRoutes } from './routes/projects'

export const API_VERSION = '1.0.0'

const allowedOrigins = (c: Context<AppEnv>) =>
  c.env.ALLOWED_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean)

export const openApiConfig = {
  openapi: '3.1.0',
  info: {
    title: 'Portfolio API',
    version: API_VERSION,
    description:
      "Backend for Noah Matsukuma's portfolio: project stats, guestbook, contact form and the platformer leaderboard. Errors use RFC 9457 problem details; write routes are rate limited per visitor and report the IETF RateLimit headers.",
  },
  tags: [
    { name: 'Projects', description: 'The project catalogue with view and like counts' },
    { name: 'Guestbook', description: 'Moderated guestbook' },
    { name: 'Contact', description: 'Contact form' },
    { name: 'Game', description: 'Server-timed platformer runs and leaderboard' },
    { name: 'Admin', description: 'Moderation, behind a bearer token' },
    { name: 'Meta' },
  ],
}

export function createApp() {
  const app = createRouter()

  app.use('*', requestContext)
  app.use('*', secureHeaders({ crossOriginResourcePolicy: 'cross-origin' }))
  app.use(
    '/v1/*',
    cors({
      origin: (origin, c) => (allowedOrigins(c).includes(origin) ? origin : null),
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['X-Request-Id', 'Retry-After', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
      maxAge: 86400,
    }),
  )
  app.use(
    '/v1/*',
    bodyLimit({
      maxSize: 16 * 1024,
      onError: () => {
        throw new ApiError(413, 'Content Too Large', 'The request body must be at most 16 KB.')
      },
    }),
  )

  app.route('/', healthRoutes)
  app.route('/', docsRoutes)
  app.route('/v1/projects', projectRoutes)
  app.route('/v1/guestbook', guestbookRoutes)
  app.route('/v1/contact', contactRoutes)
  app.route('/v1/game', gameRoutes)
  app.route('/v1/admin', adminRoutes)

  app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    description: 'The ADMIN_TOKEN secret.',
  })
  app.doc31('/openapi.json', openApiConfig)

  app.notFound((c) => problemResponse(c, new ApiError(404, 'Not Found', `No route for ${c.req.method} ${c.req.path}.`)))
  app.onError((err, c) => {
    if (err instanceof ApiError) return problemResponse(c, err)
    if (err instanceof HTTPException && err.status < 500) {
      return problemResponse(c, new ApiError(err.status, err.message || 'Bad Request'))
    }
    console.error(JSON.stringify({ event: 'unhandled_error', requestId: c.var.requestId, path: c.req.path, error: String(err), stack: err.stack }))
    return problemResponse(c, new ApiError(500, 'Internal Server Error', 'Something went wrong on our side.'))
  })

  return app
}

export type App = ReturnType<typeof createApp>

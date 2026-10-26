import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../env'
import { repositories } from '../repositories'

/** Gives every request an id (echoed in X-Request-Id and in errors) and its repositories. */
export const requestContext: MiddlewareHandler<AppEnv> = async (c, next) => {
  const id = crypto.randomUUID()
  c.set('requestId', id)
  c.set('repos', repositories(c.env.DB))
  c.header('X-Request-Id', id)
  await next()
}

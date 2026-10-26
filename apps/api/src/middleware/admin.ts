import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../env'
import { safeEqual } from '../lib/crypto'
import { unauthorized } from '../lib/errors'

/** Lets a request through only with `Authorization: Bearer <ADMIN_TOKEN>`. */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const expected = c.env.ADMIN_TOKEN
  const given = /^Bearer\s+(\S+)$/i.exec(c.req.header('Authorization') ?? '')?.[1]
  if (!expected || !given || !(await safeEqual(given, expected))) throw unauthorized()
  await next()
}

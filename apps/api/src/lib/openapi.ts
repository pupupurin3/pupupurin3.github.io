import { OpenAPIHono } from '@hono/zod-openapi'
import { Problem } from '@portfolio/shared'
import type { AppEnv } from '../env'
import { validationError } from './errors'

/** A router whose request validation failures become 400 problem responses. */
export function createRouter() {
  return new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) throw validationError(result.error)
    },
  })
}

const PROBLEM_DESCRIPTIONS = {
  400: 'The request did not pass validation; `errors` lists the messages per field.',
  401: 'Missing or wrong admin token.',
  404: 'Not found.',
  409: 'Conflicts with the current state.',
  410: 'No longer available.',
  413: 'The request body is too large.',
  422: 'Valid, but not acceptable.',
  429: 'Rate limit reached; see the Retry-After header.',
} as const

/** OpenAPI response entries for the given error statuses. */
export function problems<S extends keyof typeof PROBLEM_DESCRIPTIONS>(...statuses: S[]) {
  return Object.fromEntries(
    statuses.map((s) => [s, { description: PROBLEM_DESCRIPTIONS[s], content: { 'application/problem+json': { schema: Problem } } }]),
  ) as unknown as Record<S, { description: string; content: { 'application/problem+json': { schema: typeof Problem } } }>
}

export const json = <T>(schema: T) => ({ 'application/json': { schema } })

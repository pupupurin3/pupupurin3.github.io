import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { z } from 'zod'
import type { Problem } from '@portfolio/shared'
import type { AppEnv } from '../env'

/**
 * An error a handler can throw to send a specific HTTP status. Everything
 * else that escapes a handler becomes a 500 without leaking its message.
 */
export class ApiError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly title: string,
    detail?: string,
    readonly extra: { errors?: Record<string, string[]>; headers?: Record<string, string> } = {},
  ) {
    super(detail ?? title)
  }

  get detail(): string | undefined {
    return this.message === this.title ? undefined : this.message
  }
}

export const notFound = (detail: string) => new ApiError(404, 'Not Found', detail)
export const conflict = (detail: string) => new ApiError(409, 'Conflict', detail)
export const gone = (detail: string) => new ApiError(410, 'Gone', detail)
export const unprocessable = (detail: string) => new ApiError(422, 'Unprocessable Content', detail)
export const unauthorized = () =>
  new ApiError(401, 'Unauthorized', 'A valid admin token is required.', { headers: { 'WWW-Authenticate': 'Bearer' } })

export function validationError(error: z.ZodError): ApiError {
  const { formErrors, fieldErrors } = z.flattenError(error)
  const errors: Record<string, string[]> = {}
  for (const [field, messages] of Object.entries(fieldErrors as Record<string, string[] | undefined>)) if (messages?.length) errors[field] = messages
  if (formErrors.length) errors._ = formErrors
  return new ApiError(400, 'Bad Request', 'The request did not pass validation.', { errors })
}

/** Writes an RFC 9457 problem details response. */
export function problemResponse(c: Context<AppEnv>, err: ApiError): Response {
  const body: Problem = {
    type: 'about:blank',
    title: err.title,
    status: err.status,
    ...(err.detail && { detail: err.detail }),
    ...(err.extra.errors && { errors: err.extra.errors }),
    requestId: c.get('requestId'),
  }
  return c.body(JSON.stringify(body), err.status, {
    'Content-Type': 'application/problem+json',
    ...err.extra.headers,
  })
}

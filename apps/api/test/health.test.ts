import { describe, expect, it } from 'vitest'
import { call } from './helpers'

describe('meta', () => {
  it('reports healthy when the database answers', async () => {
    const res = await call('/health')
    expect(res.status).toBe(200)
    expect(res.json).toEqual({ status: 'ok', database: 'ok' })
    expect(res.headers.get('X-Request-Id')).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('serves an OpenAPI 3.1 document covering every route', async () => {
    const res = await call('/openapi.json')
    expect(res.status).toBe(200)
    expect(res.json.openapi).toBe('3.1.0')
    expect(Object.keys(res.json.paths)).toEqual(
      expect.arrayContaining([
        '/health',
        '/v1/projects',
        '/v1/projects/{slug}/like',
        '/v1/guestbook',
        '/v1/contact',
        '/v1/game/runs/{runId}/finish',
        '/v1/game/leaderboard',
        '/v1/admin/guestbook/{id}',
      ]),
    )
  })

  it('answers unknown routes with a problem document', async () => {
    const res = await call('/v1/nope')
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('application/problem+json')
    expect(res.json).toMatchObject({ title: 'Not Found', status: 404, requestId: expect.any(String) })
  })

  it('allows the site origin and no other', async () => {
    const ok = await call('/v1/projects')
    expect(ok.headers.get('Access-Control-Allow-Origin')).toBe('https://pupupurin3.github.io')
    const other = await call('/v1/projects', { headers: { Origin: 'https://evil.example' } })
    expect(other.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('answers CORS preflights', async () => {
    const res = await call('/v1/contact', {
      method: 'OPTIONS',
      headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
    })
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })

  it('rejects bodies over 16 KB', async () => {
    const res = await call('/v1/contact', { method: 'POST', body: { name: 'A', email: 'a@b.co', message: 'x'.repeat(20_000) } })
    expect(res.status).toBe(413)
  })

  it('reports malformed JSON as a 400', async () => {
    const res = await call('/v1/contact', { method: 'POST', body: undefined, headers: { 'Content-Type': 'application/json' } })
    expect(res.status).toBe(400)
  })
})

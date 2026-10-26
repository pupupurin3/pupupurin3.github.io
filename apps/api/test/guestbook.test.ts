import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { admin, call } from './helpers'

const sign = (body: unknown, ip?: string) => call('/v1/guestbook', { method: 'POST', body, ip })

describe('guestbook', () => {
  it('holds new entries for moderation', async () => {
    const res = await sign({ name: '  Ana ', message: 'Love the shelf!' })
    expect(res.status).toBe(202)
    expect(res.json).toEqual({ status: 'pending' })
    expect((await call('/v1/guestbook')).json).toEqual({ entries: [], nextCursor: null })

    const pending = await call('/v1/admin/guestbook', { headers: admin })
    expect(pending.json.entries).toHaveLength(1)
    expect(pending.json.entries[0]).toMatchObject({ name: 'Ana', message: 'Love the shelf!', status: 'pending', reviewedAt: null })
  })

  it('shows approved entries newest first, paged by cursor', async () => {
    for (let i = 1; i <= 5; i++) await sign({ name: `P${i}`, message: `Hello ${i}` }, `192.0.2.${i}`)
    const { results } = await env.DB.prepare('SELECT id FROM guestbook_entries ORDER BY id').all<{ id: number }>()
    for (const { id } of results.slice(0, 4)) {
      await call(`/v1/admin/guestbook/${id}`, { method: 'PATCH', body: { status: 'approved' }, headers: admin })
    }
    await call(`/v1/admin/guestbook/${results[4]!.id}`, { method: 'PATCH', body: { status: 'rejected' }, headers: admin })

    const first = await call('/v1/guestbook?limit=3')
    expect(first.json.entries.map((e: { name: string }) => e.name)).toEqual(['P4', 'P3', 'P2'])
    expect(first.json.entries[0]).toEqual({ id: expect.any(Number), name: 'P4', message: 'Hello 4', createdAt: expect.stringMatching(/Z$/) })
    const second = await call(`/v1/guestbook?limit=3&cursor=${first.json.nextCursor}`)
    expect(second.json).toEqual({ entries: [expect.objectContaining({ name: 'P1' })], nextCursor: null })
  })

  it('explains validation errors per field', async () => {
    const res = await sign({ name: '', message: 'x'.repeat(300) })
    expect(res.status).toBe(400)
    expect(res.json.errors).toEqual({
      name: ['Name is required'],
      message: ['Message must be at most 280 characters'],
    })
  })

  it('quietly drops bot submissions that fill the honeypot', async () => {
    const res = await sign({ name: 'Bot', message: 'Buy now', website: 'http://spam.example' })
    expect(res.status).toBe(202)
    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM guestbook_entries').first<{ n: number }>()
    expect(count!.n).toBe(0)
  })

  it('allows five entries per visitor per hour', async () => {
    for (let i = 0; i < 5; i++) expect((await sign({ name: 'A', message: `m${i}` })).status).toBe(202)
    expect((await sign({ name: 'A', message: 'one more' })).status).toBe(429)
  })

  it('stores text as given, leaving escaping to the page', async () => {
    await sign({ name: '<b>x</b>', message: '<script>alert(1)</script>' })
    const { entries } = (await call('/v1/admin/guestbook', { headers: admin })).json
    expect(entries[0].message).toBe('<script>alert(1)</script>')
  })
})

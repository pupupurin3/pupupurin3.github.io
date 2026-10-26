import { projects } from '@portfolio/shared'
import { describe, expect, it } from 'vitest'
import { call } from './helpers'

const stats = async (slug: string, ip?: string) => (await call(`/v1/projects/${slug}`, { ip })).json.stats

describe('projects', () => {
  it('lists the whole catalogue in order, with zeroed stats', async () => {
    const res = await call('/v1/projects')
    expect(res.status).toBe(200)
    expect(res.json.projects.map((p: { slug: string }) => p.slug)).toEqual(projects.map((p) => p.slug))
    expect(res.json.projects[0].stats).toEqual({ views: 0, likes: 0, liked: false })
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('404s for a project that does not exist', async () => {
    expect((await call('/v1/projects/nope')).status).toBe(404)
    expect((await call('/v1/projects/nope/like', { method: 'PUT' })).status).toBe(404)
  })

  it('counts one view per visitor per day', async () => {
    expect((await call('/v1/projects/hanafuda/views', { method: 'POST' })).status).toBe(204)
    await call('/v1/projects/hanafuda/views', { method: 'POST' })
    await call('/v1/projects/hanafuda/views', { method: 'POST', ip: '198.51.100.7' })
    expect((await stats('hanafuda')).views).toBe(2)
  })

  it('likes idempotently and remembers who liked', async () => {
    const first = await call('/v1/projects/tetois/like', { method: 'PUT' })
    expect(first.json).toEqual({ views: 0, likes: 1, liked: true })
    await call('/v1/projects/tetois/like', { method: 'PUT' })
    await call('/v1/projects/tetois/like', { method: 'PUT', ip: '198.51.100.7' })
    expect(await stats('tetois')).toEqual({ views: 0, likes: 2, liked: true })
    expect(await stats('tetois', '192.0.2.50')).toEqual({ views: 0, likes: 2, liked: false })

    const list = await call('/v1/projects')
    expect(list.json.projects.find((p: { slug: string }) => p.slug === 'tetois').stats).toEqual({ views: 0, likes: 2, liked: true })
  })

  it('unlikes without ever going below zero', async () => {
    await call('/v1/projects/minesweeper/like', { method: 'PUT' })
    expect((await call('/v1/projects/minesweeper/like', { method: 'DELETE' })).json).toEqual({ views: 0, likes: 0, liked: false })
    expect((await call('/v1/projects/minesweeper/like', { method: 'DELETE' })).json.likes).toBe(0)
  })

  it('rate limits likes per visitor', async () => {
    for (let i = 0; i < 30; i++) await call('/v1/projects/hanafuda/like', { method: i % 2 ? 'DELETE' : 'PUT' })
    const res = await call('/v1/projects/hanafuda/like', { method: 'PUT' })
    expect(res.status).toBe(429)
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0)
    expect(res.headers.get('RateLimit-Remaining')).toBe('0')
    // Another visitor is unaffected.
    expect((await call('/v1/projects/hanafuda/like', { method: 'PUT', ip: '198.51.100.7' })).status).toBe(200)
  })
})

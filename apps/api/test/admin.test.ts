import { createScheduledController } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import worker from '../src/index'
import { describe, expect, it } from 'vitest'
import { admin, call } from './helpers'

describe('admin', () => {
  it('requires the bearer token', async () => {
    expect((await call('/v1/admin/messages')).status).toBe(401)
    const wrong = await call('/v1/admin/messages', { headers: { Authorization: 'Bearer nope' } })
    expect(wrong.status).toBe(401)
    expect(wrong.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect((await call('/v1/admin/messages', { headers: admin })).status).toBe(200)
  })

  it('approves, rejects and deletes entries', async () => {
    await call('/v1/guestbook', { method: 'POST', body: { name: 'A', message: 'hi' } })
    const [entry] = (await call('/v1/admin/guestbook', { headers: admin })).json.entries
    const approved = await call(`/v1/admin/guestbook/${entry.id}`, { method: 'PATCH', body: { status: 'approved' }, headers: admin })
    expect(approved.json).toMatchObject({ status: 'approved', reviewedAt: expect.any(String) })
    expect((await call('/v1/guestbook')).json.entries).toHaveLength(1)

    expect((await call(`/v1/admin/guestbook/${entry.id}`, { method: 'DELETE', headers: admin })).status).toBe(204)
    expect((await call(`/v1/admin/guestbook/${entry.id}`, { method: 'DELETE', headers: admin })).status).toBe(404)
    expect((await call('/v1/admin/guestbook/999', { method: 'PATCH', body: { status: 'approved' }, headers: admin })).status).toBe(404)
  })

  it('rejects unknown moderation states', async () => {
    const res = await call('/v1/admin/guestbook/1', { method: 'PATCH', body: { status: 'pending' }, headers: admin })
    expect(res.status).toBe(400)
  })

  it('removes runs from the leaderboard', async () => {
    const { runId } = (await call('/v1/game/runs', { method: 'POST' })).json
    await env.DB.prepare('UPDATE game_runs SET started_at = started_at - 20000 WHERE id = ?1').bind(runId).run()
    await call(`/v1/game/runs/${runId}/finish`, { method: 'POST', body: { name: 'Cheater', stars: 8 } })
    expect((await call(`/v1/admin/game/runs/${runId}`, { method: 'DELETE', headers: admin })).status).toBe(204)
    expect((await call('/v1/game/leaderboard')).json.entries).toEqual([])
  })
})

describe('nightly clean-up', () => {
  it('prunes old rate-limit windows, view rows and abandoned runs but keeps totals', async () => {
    await call('/v1/projects/hanafuda/views', { method: 'POST' })
    await call('/v1/game/runs', { method: 'POST' })
    const later = Date.now() + 3 * 24 * 60 * 60 * 1000
    await worker.scheduled(createScheduledController({ scheduledTime: later, cron: '17 3 * * *' }), env)

    const counts = await env.DB.batch<{ n: number }>([
      env.DB.prepare('SELECT COUNT(*) AS n FROM rate_limits'),
      env.DB.prepare('SELECT COUNT(*) AS n FROM project_views'),
      env.DB.prepare('SELECT COUNT(*) AS n FROM game_runs'),
    ])
    expect(counts.map((r) => r.results[0]!.n)).toEqual([0, 0, 0])
    expect((await call('/v1/projects/hanafuda')).json.stats.views).toBe(1)
  })
})

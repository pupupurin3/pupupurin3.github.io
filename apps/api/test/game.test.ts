import { GAME_MAX_RUN_MS, GAME_STARS } from '@portfolio/shared'
import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { call } from './helpers'

async function startRun(ip?: string): Promise<string> {
  const res = await call('/v1/game/runs', { method: 'POST', ip })
  expect(res.status).toBe(201)
  return res.json.runId
}

/** Moves a run's start back in time, as if the player had been playing that long. */
async function age(runId: string, ms: number) {
  await env.DB.prepare('UPDATE game_runs SET started_at = started_at - ?2 WHERE id = ?1').bind(runId, ms).run()
}

const finish = (runId: string, name: string, ip?: string, stars = GAME_STARS) =>
  call(`/v1/game/runs/${runId}/finish`, { method: 'POST', body: { name, stars }, ip })

describe('game', () => {
  it('times runs on the server and ranks them', async () => {
    const a = await startRun()
    await age(a, 42_000)
    const res = await finish(a, 'Ana')
    expect(res.status).toBe(200)
    expect(res.json.timeMs).toBeGreaterThanOrEqual(42_000)
    expect(res.json.timeMs).toBeLessThan(43_000)
    expect(res.json).toMatchObject({ rank: 1, personalBest: true })

    const b = await startRun('198.51.100.7')
    await age(b, 30_000)
    expect((await finish(b, 'Ben', '198.51.100.7')).json).toMatchObject({ rank: 1, personalBest: true })

    const board = await call('/v1/game/leaderboard')
    expect(board.json.entries.map((e: { name: string; rank: number }) => [e.rank, e.name])).toEqual([
      [1, 'Ben'],
      [2, 'Ana'],
    ])
  })

  it("keeps only each player's best time on the board", async () => {
    const first = await startRun()
    await age(first, 20_000)
    await finish(first, 'Ana')
    const slower = await startRun()
    await age(slower, 50_000)
    expect((await finish(slower, 'ana')).json).toMatchObject({ rank: 1, personalBest: false })

    const board = await call('/v1/game/leaderboard')
    expect(board.json.entries).toHaveLength(1)
    expect(board.json.entries[0].timeMs).toBeLessThan(21_000)
  })

  it('rejects runs that are too fast to be real', async () => {
    const run = await startRun()
    const res = await finish(run, 'Speedy')
    expect(res.status).toBe(422)
    expect(res.json.detail).toMatch(/too fast/)
  })

  it('requires every star', async () => {
    const run = await startRun()
    await age(run, 20_000)
    expect((await finish(run, 'Ana', undefined, GAME_STARS - 1)).status).toBe(422)
  })

  it('finishes a run only once', async () => {
    const run = await startRun()
    await age(run, 20_000)
    expect((await finish(run, 'Ana')).status).toBe(200)
    expect((await finish(run, 'Ana')).status).toBe(409)
  })

  it('expires abandoned runs', async () => {
    const run = await startRun()
    await age(run, GAME_MAX_RUN_MS + 1)
    expect((await finish(run, 'Ana')).status).toBe(410)
  })

  it("won't let another visitor finish your run", async () => {
    const run = await startRun()
    await age(run, 20_000)
    expect((await finish(run, 'Thief', '198.51.100.7')).status).toBe(404)
  })

  it('validates the run id and name', async () => {
    expect((await finish('not-a-uuid', 'Ana')).status).toBe(400)
    expect((await finish(crypto.randomUUID(), 'Ana')).status).toBe(404)
    const run = await startRun()
    expect((await finish(run, ' ')).status).toBe(400)
  })
})

import { createRoute, z } from '@hono/zod-openapi'
import { GameRunFinishInput, GameRunResult, GameRunStart, Leaderboard } from '@portfolio/shared'
import { conflict } from '../lib/errors'
import { createRouter, json, problems } from '../lib/openapi'
import { HOUR, iso } from '../lib/time'
import { visitorId } from '../lib/visitor'
import { rateLimit } from '../middleware/rateLimit'
import { scoreRun } from '../services/game'

const gameLimit = rateLimit({ name: 'game', limit: 60, windowMs: HOUR })
const RunParam = z.object({ runId: z.uuid() })

const start = createRoute({
  method: 'post',
  path: '/runs',
  tags: ['Game'],
  summary: 'Start a timed run of the platformer',
  description: 'The server starts the clock here. Finish the run with the returned id.',
  middleware: [gameLimit] as const,
  responses: { 201: { description: 'Run started', content: json(GameRunStart) }, ...problems(429) },
})

const finish = createRoute({
  method: 'post',
  path: '/runs/{runId}/finish',
  tags: ['Game'],
  summary: 'Finish a run and post it to the leaderboard',
  description:
    'The official time is measured by the server from start to finish, so a modified client cannot post a faster time than it really took. A run must collect every star, can be finished once, and expires after an hour.',
  request: { params: RunParam, body: { content: json(GameRunFinishInput), required: true } },
  middleware: [gameLimit] as const,
  responses: {
    200: { description: 'Time recorded', content: json(GameRunResult) },
    ...problems(400, 404, 409, 410, 422, 429),
  },
})

const board = createRoute({
  method: 'get',
  path: '/leaderboard',
  tags: ['Game'],
  summary: 'Fastest players',
  description: "Each player's best time, fastest first.",
  request: { query: z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) }) },
  responses: { 200: { description: 'The leaderboard', content: json(Leaderboard) }, ...problems(400) },
})

export const gameRoutes = createRouter()
  .openapi(start, async (c) => {
    const runId = crypto.randomUUID()
    const now = Date.now()
    await c.var.repos.runs.create(runId, await visitorId(c), now)
    return c.json({ runId, startedAt: iso(now) }, 201)
  })
  .openapi(finish, async (c) => {
    const { runId } = c.req.valid('param')
    const { name, stars } = c.req.valid('json')
    const runs = c.var.repos.runs
    const now = Date.now()
    const timeMs = scoreRun(await runs.get(runId), await visitorId(c), stars, now)
    // A second finish request for the same run can pass the check above at the
    // same moment; the conditional update lets only one of them through.
    if (!(await runs.finish(runId, name, timeMs, now))) throw conflict('This run is already finished.')
    return c.json({ timeMs, ...(await runs.placement(runId, name, timeMs)) }, 200)
  })
  .openapi(board, async (c) => {
    const rows = await c.var.repos.runs.leaderboard(c.req.valid('query').limit)
    c.header('Cache-Control', 'public, max-age=15')
    return c.json(
      { entries: rows.map((r, i) => ({ rank: i + 1, name: r.name, timeMs: r.time_ms, finishedAt: iso(r.finished_at) })) },
      200,
    )
  })

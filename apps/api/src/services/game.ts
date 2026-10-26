import { GAME_MAX_RUN_MS, GAME_MIN_RUN_MS, GAME_STARS } from '@portfolio/shared'
import { conflict, gone, notFound, unprocessable } from '../lib/errors'
import type { RunRow } from '../repositories/runs'

/**
 * Checks a finish request and returns the run's official time: the time the
 * server saw pass between "start" and "finish". Throws the error to send
 * when the run can't be scored.
 */
export function scoreRun(run: RunRow | null, visitor: string, stars: number, now: number): number {
  // Someone else's run looks exactly like a missing one.
  if (!run || run.visitor_hash !== visitor) throw notFound('There is no such run.')
  if (run.finished_at !== null) throw conflict('This run is already finished.')
  const elapsed = now - run.started_at
  if (elapsed > GAME_MAX_RUN_MS) throw gone('This run has expired. Start a new one.')
  if (stars < GAME_STARS) throw unprocessable(`Collect all ${GAME_STARS} stars to post a time.`)
  if (elapsed < GAME_MIN_RUN_MS) throw unprocessable('That run was too fast to be real.')
  return elapsed
}

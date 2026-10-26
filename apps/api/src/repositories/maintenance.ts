/** Deletes data that has served its purpose. Run nightly by the cron trigger. */
export async function prune(db: D1Database, cutoffs: { rateLimitsBefore: number; viewsBeforeDay: string; unfinishedRunsBefore: number }) {
  const results = await db.batch([
    db.prepare('DELETE FROM rate_limits WHERE window_start < ?1').bind(cutoffs.rateLimitsBefore),
    db.prepare('DELETE FROM project_views WHERE day < ?1').bind(cutoffs.viewsBeforeDay),
    db.prepare('DELETE FROM game_runs WHERE finished_at IS NULL AND started_at < ?1').bind(cutoffs.unfinishedRunsBefore),
  ])
  const [rateLimits, views, runs] = results.map((r) => r.meta.changes)
  return { rateLimits, views, runs }
}

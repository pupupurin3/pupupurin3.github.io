export interface RunRow {
  id: string
  visitor_hash: string
  started_at: number
  finished_at: number | null
  name: string | null
  time_ms: number | null
}

export interface BestRun {
  name: string
  time_ms: number
  finished_at: number
}

export class RunRepository {
  constructor(private readonly db: D1Database) {}

  async create(id: string, visitor: string, now: number): Promise<void> {
    await this.db
      .prepare('INSERT INTO game_runs (id, visitor_hash, started_at) VALUES (?1, ?2, ?3)')
      .bind(id, visitor, now)
      .run()
  }

  async get(id: string): Promise<RunRow | null> {
    return this.db.prepare('SELECT * FROM game_runs WHERE id = ?1').bind(id).first<RunRow>()
  }

  /**
   * Marks the run finished. Returns false if it was already finished, which
   * also covers two finish requests racing each other.
   */
  async finish(id: string, name: string, timeMs: number, now: number): Promise<boolean> {
    const { meta } = await this.db
      .prepare('UPDATE game_runs SET finished_at = ?2, name = ?3, time_ms = ?4 WHERE id = ?1 AND finished_at IS NULL')
      .bind(id, now, name, timeMs)
      .run()
    return meta.changes > 0
  }

  /** Each player's best run (names compared case-insensitively), fastest first. */
  async leaderboard(limit: number): Promise<BestRun[]> {
    const { results } = await this.db
      .prepare(
        `SELECT name, time_ms, finished_at FROM (
           SELECT name, time_ms, finished_at,
                  ROW_NUMBER() OVER (PARTITION BY lower(name) ORDER BY time_ms, finished_at) AS n
             FROM game_runs WHERE time_ms IS NOT NULL
         ) WHERE n = 1
         ORDER BY time_ms, finished_at
         LIMIT ?1`,
      )
      .bind(limit)
      .all<BestRun>()
    return results
  }

  /**
   * Where a time places among players' bests, and whether it beats this
   * player's earlier runs.
   */
  async placement(runId: string, name: string, timeMs: number): Promise<{ rank: number; personalBest: boolean }> {
    const row = await this.db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM (
              SELECT MIN(time_ms) AS best FROM game_runs
               WHERE time_ms IS NOT NULL AND lower(name) <> lower(?2)
               GROUP BY lower(name)
            ) WHERE best < ?3) + 1 AS rank,
           NOT EXISTS (
             SELECT 1 FROM game_runs
              WHERE time_ms IS NOT NULL AND lower(name) = lower(?2) AND id <> ?1 AND time_ms <= ?3
           ) AS personal_best`,
      )
      .bind(runId, name, timeMs)
      .first<{ rank: number; personal_best: number }>()
    return { rank: row!.rank, personalBest: row!.personal_best === 1 }
  }

  async remove(id: string): Promise<boolean> {
    const { meta } = await this.db.prepare('DELETE FROM game_runs WHERE id = ?1').bind(id).run()
    return meta.changes > 0
  }
}

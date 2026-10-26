export class RateLimitRepository {
  constructor(private readonly db: D1Database) {}

  /** Counts one hit against `key` in the window and returns the new total. */
  async hit(key: string, windowStart: number): Promise<number> {
    const row = await this.db
      .prepare(
        `INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
         ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1
         RETURNING count`,
      )
      .bind(key, windowStart)
      .first<{ count: number }>()
    return row!.count
  }
}

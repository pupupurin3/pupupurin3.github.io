export interface Counts {
  views: number
  likes: number
}

export class ProjectRepository {
  constructor(private readonly db: D1Database) {}

  /** Totals for every project that has any, plus the slugs this visitor liked. */
  async allStats(visitor: string): Promise<{ counts: Map<string, Counts>; liked: Set<string> }> {
    const [counts, liked] = await this.db.batch<{ slug: string; views: number; likes: number }>([
      this.db.prepare('SELECT slug, views, likes FROM project_counters'),
      this.db.prepare('SELECT slug FROM project_likes WHERE visitor_hash = ?1').bind(visitor),
    ])
    return {
      counts: new Map(counts!.results.map((r) => [r.slug, { views: r.views, likes: r.likes }])),
      liked: new Set(liked!.results.map((r) => r.slug)),
    }
  }

  async stats(slug: string, visitor: string): Promise<Counts & { liked: boolean }> {
    const row = await this.db
      .prepare(
        `SELECT COALESCE(c.views, 0) AS views,
                COALESCE(c.likes, 0) AS likes,
                EXISTS (SELECT 1 FROM project_likes WHERE slug = ?1 AND visitor_hash = ?2) AS liked
           FROM (SELECT ?1 AS slug) s LEFT JOIN project_counters c USING (slug)`,
      )
      .bind(slug, visitor)
      .first<{ views: number; likes: number; liked: number }>()
    return { views: row!.views, likes: row!.likes, liked: row!.liked === 1 }
  }

  /** Counts a view unless this visitor already viewed the project today. */
  async recordView(slug: string, visitor: string, day: string): Promise<boolean> {
    const { meta } = await this.db
      .prepare('INSERT OR IGNORE INTO project_views (slug, visitor_hash, day) VALUES (?1, ?2, ?3)')
      .bind(slug, visitor, day)
      .run()
    return meta.changes > 0
  }

  // Liking twice or unliking twice is a no-op: the primary key makes both idempotent,
  // and the counters only move when a row is actually added or removed.
  async like(slug: string, visitor: string, now: number): Promise<void> {
    await this.db
      .prepare('INSERT OR IGNORE INTO project_likes (slug, visitor_hash, created_at) VALUES (?1, ?2, ?3)')
      .bind(slug, visitor, now)
      .run()
  }

  async unlike(slug: string, visitor: string): Promise<void> {
    await this.db.prepare('DELETE FROM project_likes WHERE slug = ?1 AND visitor_hash = ?2').bind(slug, visitor).run()
  }
}

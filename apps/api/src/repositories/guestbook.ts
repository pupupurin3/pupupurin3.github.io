export type EntryStatus = 'pending' | 'approved' | 'rejected'

export interface GuestbookRow {
  id: number
  name: string
  message: string
  status: EntryStatus
  created_at: number
  reviewed_at: number | null
}

export class GuestbookRepository {
  constructor(private readonly db: D1Database) {}

  /** Approved entries, newest first, starting below `beforeId` when given. */
  async listApproved(limit: number, beforeId?: number): Promise<GuestbookRow[]> {
    const { results } = await this.db
      .prepare(
        `SELECT id, name, message, status, created_at, reviewed_at
           FROM guestbook_entries
          WHERE status = 'approved' AND (?1 IS NULL OR id < ?1)
          ORDER BY id DESC
          LIMIT ?2`,
      )
      .bind(beforeId ?? null, limit)
      .all<GuestbookRow>()
    return results
  }

  async listByStatus(status: EntryStatus, limit: number): Promise<GuestbookRow[]> {
    const { results } = await this.db
      .prepare(
        `SELECT id, name, message, status, created_at, reviewed_at
           FROM guestbook_entries WHERE status = ?1 ORDER BY id DESC LIMIT ?2`,
      )
      .bind(status, limit)
      .all<GuestbookRow>()
    return results
  }

  async create(entry: { name: string; message: string; visitor: string; now: number }): Promise<number> {
    const row = await this.db
      .prepare(
        `INSERT INTO guestbook_entries (name, message, visitor_hash, created_at)
         VALUES (?1, ?2, ?3, ?4) RETURNING id`,
      )
      .bind(entry.name, entry.message, entry.visitor, entry.now)
      .first<{ id: number }>()
    return row!.id
  }

  async setStatus(id: number, status: EntryStatus, now: number): Promise<GuestbookRow | null> {
    return this.db
      .prepare(
        `UPDATE guestbook_entries SET status = ?2, reviewed_at = ?3 WHERE id = ?1
         RETURNING id, name, message, status, created_at, reviewed_at`,
      )
      .bind(id, status, now)
      .first<GuestbookRow>()
  }

  async remove(id: number): Promise<boolean> {
    const { meta } = await this.db.prepare('DELETE FROM guestbook_entries WHERE id = ?1').bind(id).run()
    return meta.changes > 0
  }
}

export interface MessageRow {
  id: number
  name: string
  email: string
  message: string
  created_at: number
}

export class MessageRepository {
  constructor(private readonly db: D1Database) {}

  async create(msg: { name: string; email: string; message: string; visitor: string; now: number }): Promise<number> {
    const row = await this.db
      .prepare(
        `INSERT INTO contact_messages (name, email, message, visitor_hash, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id`,
      )
      .bind(msg.name, msg.email, msg.message, msg.visitor, msg.now)
      .first<{ id: number }>()
    return row!.id
  }

  async list(limit: number, beforeId?: number): Promise<MessageRow[]> {
    const { results } = await this.db
      .prepare(
        `SELECT id, name, email, message, created_at FROM contact_messages
          WHERE ?1 IS NULL OR id < ?1 ORDER BY id DESC LIMIT ?2`,
      )
      .bind(beforeId ?? null, limit)
      .all<MessageRow>()
    return results
  }
}

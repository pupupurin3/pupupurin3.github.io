import { GuestbookRepository } from './guestbook'
import { MessageRepository } from './messages'
import { ProjectRepository } from './projects'
import { RateLimitRepository } from './rateLimits'
import { RunRepository } from './runs'

export function repositories(db: D1Database) {
  return {
    guestbook: new GuestbookRepository(db),
    messages: new MessageRepository(db),
    projects: new ProjectRepository(db),
    rateLimits: new RateLimitRepository(db),
    runs: new RunRepository(db),
  }
}
export type Repositories = ReturnType<typeof repositories>

import { applyD1Migrations } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { beforeEach } from 'vitest'

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)

const TABLES = ['guestbook_entries', 'contact_messages', 'project_counters', 'project_views', 'project_likes', 'game_runs', 'rate_limits']

// Each test starts from empty tables.
beforeEach(async () => {
  await env.DB.batch(TABLES.map((t) => env.DB.prepare(`DELETE FROM ${t}`)))
})

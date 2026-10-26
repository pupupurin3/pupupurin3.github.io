import { createApp } from './app'
import type { Bindings } from './env'
import { HOUR, DAY, utcDay } from './lib/time'
import { prune } from './repositories/maintenance'
import { GAME_MAX_RUN_MS } from '@portfolio/shared'

const app = createApp()

export default {
  fetch: app.fetch,

  // Nightly clean-up (see `triggers` in wrangler.jsonc).
  async scheduled(controller, env) {
    const now = controller.scheduledTime
    const removed = await prune(env.DB, {
      rateLimitsBefore: now - HOUR * 2,
      viewsBeforeDay: utcDay(now - DAY),
      unfinishedRunsBefore: now - GAME_MAX_RUN_MS,
    })
    console.log(JSON.stringify({ event: 'pruned', ...removed }))
  },
} satisfies ExportedHandler<Bindings>

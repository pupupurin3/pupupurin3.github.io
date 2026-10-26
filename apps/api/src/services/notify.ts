import type { Context } from 'hono'
import type { AppEnv } from '../env'

/**
 * Posts a short note to the configured Discord or Slack webhook after the
 * response has been sent, so a slow webhook never delays the visitor.
 */
export function notify(c: Context<AppEnv>, text: string): void {
  const url = c.env.NOTIFY_WEBHOOK_URL
  if (!url) return
  const send = fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // `content` is Discord's field, `text` is Slack's. Mentions are disabled so a
    // visitor can't make the message ping @everyone.
    body: JSON.stringify({ content: text, text, allowed_mentions: { parse: [] } }),
  })
    .then((res) => {
      if (!res.ok) console.error(JSON.stringify({ event: 'notify_failed', status: res.status, requestId: c.var.requestId }))
    })
    .catch((err: unknown) => console.error(JSON.stringify({ event: 'notify_failed', error: String(err), requestId: c.var.requestId })))
  c.executionCtx.waitUntil(send)
}

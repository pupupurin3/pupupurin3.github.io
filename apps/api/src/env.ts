import type { Repositories } from './repositories'

/** Worker bindings: `Env` (generated from wrangler.jsonc) plus secrets. */
export interface Bindings extends Env {
  /** Bearer token for the /v1/admin routes. While unset, they refuse every request. */
  ADMIN_TOKEN?: string
  /** Salt for visitor hashes. Rotating it resets "already liked/viewed". */
  HASH_SALT?: string
  /** Optional Discord or Slack webhook that is pinged on new messages. */
  NOTIFY_WEBHOOK_URL?: string
}

export interface Variables {
  requestId: string
  repos: Repositories
  /** Memoised by visitorId(). */
  visitor?: string
}

export interface AppEnv {
  Bindings: Bindings
  Variables: Variables
}

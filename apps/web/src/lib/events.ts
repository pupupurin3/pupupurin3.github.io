// Typed window events that let distant components talk without prop
// drilling: the command palette opens projects, the hero starts the game.

export interface SiteEvents {
  /** Open a project's details by slug. */
  'open-project': string
  'toggle-game': undefined
  'open-palette': undefined
  /** A run was posted, so an open leaderboard should refresh. */
  'leaderboard-changed': undefined
}

type EventName = keyof SiteEvents

export function emit<K extends EventName>(name: K, ...detail: SiteEvents[K] extends undefined ? [] : [SiteEvents[K]]): void {
  window.dispatchEvent(new CustomEvent(name, { detail: detail[0] }))
}

/** Subscribes to a site event; returns the unsubscribe function. */
export function on<K extends EventName>(name: K, handler: (detail: SiteEvents[K]) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<SiteEvents[K]>).detail)
  window.addEventListener(name, listener)
  return () => window.removeEventListener(name, listener)
}

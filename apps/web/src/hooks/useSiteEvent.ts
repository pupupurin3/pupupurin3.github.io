import { useEffect, useRef } from 'react'
import { on, type SiteEvents } from '../lib/events'

/** Listens for a site event for as long as the component is mounted. */
export function useSiteEvent<K extends keyof SiteEvents>(name: K, handler: (detail: SiteEvents[K]) => void) {
  // Always call the latest handler without re-subscribing on every render.
  const latest = useRef(handler)
  latest.current = handler
  useEffect(() => on(name, (d) => latest.current(d)), [name])
}

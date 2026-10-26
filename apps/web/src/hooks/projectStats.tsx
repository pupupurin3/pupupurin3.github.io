import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ProjectStats } from '@portfolio/shared'
import { api, apiEnabled } from '../lib/api'

interface StatsContext {
  stats: Record<string, ProjectStats>
  toggleLike: (slug: string) => void
  recordView: (slug: string) => void
}

const Ctx = createContext<StatsContext | null>(null)

/**
 * Loads every project's view and like counts once and keeps them in sync as
 * the visitor likes or opens projects. Likes update instantly and roll back
 * if the API refuses.
 */
export function ProjectStatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<Record<string, ProjectStats>>({})

  useEffect(() => {
    if (!apiEnabled) return
    api
      .projects()
      .then(({ projects }) => setStats(Object.fromEntries(projects.map((p) => [p.slug, p.stats]))))
      .catch(() => {
        // Counts are a nice extra; without them the site just doesn't show any.
      })
  }, [])

  const latest = useRef(stats)
  latest.current = stats

  const toggleLike = useCallback((slug: string) => {
    const current = latest.current[slug]
    if (!current) return
    const liked = !current.liked
    setStats((s) => ({ ...s, [slug]: { ...current, liked, likes: current.likes + (liked ? 1 : -1) } }))
    api
      .setLiked(slug, liked)
      .then((fresh) => setStats((s) => ({ ...s, [slug]: fresh })))
      .catch(() => setStats((s) => ({ ...s, [slug]: current })))
  }, [])

  const recordView = useCallback((slug: string) => {
    if (!apiEnabled) return
    // The API counts once per visitor per day, so this can't inflate the count.
    api.recordView(slug).catch(() => {})
  }, [])

  const value = useMemo(() => ({ stats, toggleLike, recordView }), [stats, toggleLike, recordView])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Counts for one project (undefined until loaded, or with no API), plus actions. */
export function useProjectStats(slug: string) {
  const ctx = useContext(Ctx)
  return {
    stats: ctx?.stats[slug],
    toggleLike: () => ctx?.toggleLike(slug),
    recordView: () => ctx?.recordView(slug),
  }
}

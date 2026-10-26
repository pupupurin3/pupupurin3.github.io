import type {
  Accepted,
  ContactInput,
  GameRunFinishInput,
  GameRunResult,
  GameRunStart,
  GuestbookEntryInput,
  GuestbookPage,
  Leaderboard,
  Problem,
  ProjectList,
  ProjectStats,
} from '@portfolio/shared'

// Client for the portfolio API (apps/api). The site works without it: when
// VITE_API_URL isn't set at build time, `apiEnabled` is false and the
// features that need the API don't render.

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')
export const apiEnabled = !!API_URL

/** An error response from the API, carrying its problem details. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem?: Problem,
  ) {
    super(problem?.detail ?? problem?.title ?? `Request failed (${status})`)
  }

  /** Field-level validation messages, if any. */
  get fieldErrors(): Record<string, string[]> {
    return this.problem?.errors ?? {}
  }
}

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  if (!API_URL) throw new ApiError(0, { type: 'about:blank', title: 'API not configured', status: 0 })
  const { json, ...rest } = init
  let res: Response
  try {
    res = await fetch(API_URL + path, {
      ...rest,
      headers: { ...(json !== undefined && { 'Content-Type': 'application/json' }), ...rest.headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    })
  } catch {
    throw new ApiError(0, { type: 'about:blank', title: 'Network error', status: 0, detail: "Couldn't reach the server. Check your connection and try again." })
  }
  if (!res.ok) {
    const problem = (await res.json().catch(() => undefined)) as Problem | undefined
    throw new ApiError(res.status, problem)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}

export const api = {
  projects: () => request<ProjectList>('/v1/projects'),
  recordView: (slug: string) => request<void>(`/v1/projects/${encodeURIComponent(slug)}/views`, { method: 'POST' }),
  setLiked: (slug: string, liked: boolean) =>
    request<ProjectStats>(`/v1/projects/${encodeURIComponent(slug)}/like`, { method: liked ? 'PUT' : 'DELETE' }),

  guestbook: (cursor?: number) => request<GuestbookPage>(`/v1/guestbook?limit=8${cursor ? `&cursor=${cursor}` : ''}`),
  signGuestbook: (input: GuestbookEntryInput) => request<Accepted>('/v1/guestbook', { method: 'POST', json: input }),

  contact: (input: ContactInput) => request<Accepted>('/v1/contact', { method: 'POST', json: input }),

  startRun: () => request<GameRunStart>('/v1/game/runs', { method: 'POST' }),
  finishRun: (runId: string, input: GameRunFinishInput) =>
    request<GameRunResult>(`/v1/game/runs/${runId}/finish`, { method: 'POST', json: input }),
  leaderboard: (limit = 5) => request<Leaderboard>(`/v1/game/leaderboard?limit=${limit}`),
}

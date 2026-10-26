export const iso = (ms: number) => new Date(ms).toISOString()

/** UTC calendar day, e.g. 2026-10-26. */
export const utcDay = (ms: number) => iso(ms).slice(0, 10)

export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

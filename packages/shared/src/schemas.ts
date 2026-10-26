import { z } from 'zod'
import { ProjectSchema } from './projects'

// Request and response bodies for the portfolio API. The API validates
// against these and documents them in its OpenAPI spec; the site uses the
// inferred types for its client and runs the same checks before submitting
// a form, so a visitor sees an error before the request is ever sent.

export const LIMITS = {
  name: 40,
  guestbookMessage: 280,
  contactMessage: 4000,
  email: 254,
} as const

/** Stars to collect in the platformer. A run counts only with all of them. */
export const GAME_STARS = 8
/**
 * Fastest run the API accepts. Run times are measured by the server, from
 * the start request to the finish request, so a modified client can't post
 * a faster time than it really took; this floor stops a script from posting
 * "finish" straight after "start".
 */
export const GAME_MIN_RUN_MS = 8_000
/** A started run can be finished for this long. */
export const GAME_MAX_RUN_MS = 60 * 60 * 1000

const trimmed = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`)
    // Control characters (other than newlines and tabs) have no place in a message.
    // eslint-disable-next-line no-control-regex -- matching control characters is the point
    .refine((s) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(s), `${label} contains invalid characters`)

export const NameSchema = trimmed(LIMITS.name, 'Name')

/**
 * Hidden form field that people never see or fill in. Bots that fill every
 * input trip it, and the API quietly drops their submission.
 */
export const HoneypotSchema = z
  .string()
  .max(200)
  .optional()
  .meta({ description: 'Leave empty. Hidden from people; bots that fill it are ignored.' })

export const GuestbookEntryInput = z.object({
  name: NameSchema,
  message: trimmed(LIMITS.guestbookMessage, 'Message'),
  website: HoneypotSchema,
}).meta({ id: 'GuestbookEntryInput' })

export type GuestbookEntryInput = z.infer<typeof GuestbookEntryInput>

export const GuestbookEntry = z.object({
  id: z.number().int(),
  name: z.string(),
  message: z.string(),
  createdAt: z.string(),
}).meta({ id: 'GuestbookEntry' })

export type GuestbookEntry = z.infer<typeof GuestbookEntry>

export const GuestbookPage = z.object({
  entries: z.array(GuestbookEntry),
  /** Pass as `cursor` to get the next (older) page; null on the last page. */
  nextCursor: z.number().int().nullable(),
}).meta({ id: 'GuestbookPage' })

export type GuestbookPage = z.infer<typeof GuestbookPage>

export const ContactInput = z.object({
  name: NameSchema,
  email: z.email('Enter a valid email address').max(LIMITS.email),
  message: trimmed(LIMITS.contactMessage, 'Message').refine((s) => s.length >= 10, 'Message must be at least 10 characters'),
  website: HoneypotSchema,
}).meta({ id: 'ContactInput' })

export type ContactInput = z.infer<typeof ContactInput>

export const Accepted = z.object({
  status: z.enum(['received', 'pending']),
}).meta({ id: 'Accepted' })

export type Accepted = z.infer<typeof Accepted>

export const ProjectStats = z.object({
  views: z.number().int(),
  likes: z.number().int(),
  /** Whether the visitor making the request has liked it. */
  liked: z.boolean(),
}).meta({ id: 'ProjectStats' })

export type ProjectStats = z.infer<typeof ProjectStats>

export const ProjectWithStats = ProjectSchema.extend({ stats: ProjectStats }).meta({ id: 'ProjectWithStats' })

export type ProjectWithStats = z.infer<typeof ProjectWithStats>

export const ProjectList = z.object({ projects: z.array(ProjectWithStats) }).meta({ id: 'ProjectList' })

export type ProjectList = z.infer<typeof ProjectList>

export const GameRunStart = z.object({
  runId: z.uuid(),
  startedAt: z.string(),
}).meta({ id: 'GameRunStart' })

export type GameRunStart = z.infer<typeof GameRunStart>

export const GameRunFinishInput = z.object({
  name: NameSchema,
  stars: z.number().int().min(0).max(GAME_STARS),
}).meta({ id: 'GameRunFinishInput' })

export type GameRunFinishInput = z.infer<typeof GameRunFinishInput>

export const LeaderboardEntry = z.object({
  rank: z.number().int(),
  name: z.string(),
  timeMs: z.number().int(),
  finishedAt: z.string(),
}).meta({ id: 'LeaderboardEntry' })

export type LeaderboardEntry = z.infer<typeof LeaderboardEntry>

export const Leaderboard = z.object({ entries: z.array(LeaderboardEntry) }).meta({ id: 'Leaderboard' })

export type Leaderboard = z.infer<typeof Leaderboard>

export const GameRunResult = z.object({
  /** The official time, measured by the server. */
  timeMs: z.number().int(),
  /** 1-based position on the leaderboard. */
  rank: z.number().int(),
  personalBest: z.boolean(),
}).meta({ id: 'GameRunResult' })

export type GameRunResult = z.infer<typeof GameRunResult>

/** RFC 9457 problem details, returned for every error. */
export const Problem = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  /** Field-level messages for validation errors, keyed by field name. */
  errors: z.record(z.string(), z.array(z.string())).optional(),
  requestId: z.string().optional(),
}).meta({ id: 'Problem' })

export type Problem = z.infer<typeof Problem>

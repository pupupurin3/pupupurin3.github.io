import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LIMITS, type LeaderboardEntry } from '@portfolio/shared'
import type { ShowToast } from '../../hooks/useToast'
import { api, ApiError } from '../../lib/api'
import { emit, on } from '../../lib/events'
import { readStorage, writeStorage } from '../../lib/storage'
import { formatTime } from './render'

const NAME_KEY = 'purin-name'

/** After a full clear: a name field that posts the run to the leaderboard. */
export function PostTime({ runId, stars, onToast, onDone }: { runId: string; stars: number; onToast: ShowToast; onDone: () => void }) {
  const [name, setName] = useState(() => readStorage(NAME_KEY) ?? '')
  const [sending, setSending] = useState(false)
  const field = useRef<HTMLInputElement>(null)
  useEffect(() => field.current?.focus(), [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || sending) return
    setSending(true)
    try {
      const result = await api.finishRun(runId, { name: name.trim(), stars })
      writeStorage(NAME_KEY, name.trim())
      onToast(`${formatTime(result.timeMs / 1000)} is #${result.rank} on the leaderboard${result.personalBest ? '. Personal best!' : ''}`)
      emit('leaderboard-changed')
      onDone()
    } catch (err) {
      onToast(err instanceof ApiError ? err.message : "Couldn't post your time")
      setSending(false)
    }
  }

  return (
    <form className="play-post" onSubmit={submit}>
      <input
        ref={field}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={LIMITS.name}
        placeholder="Your name"
        aria-label="Name for the leaderboard"
      />
      <button className="play-btn primary" type="submit" disabled={sending || !name.trim()}>
        Post time
      </button>
    </form>
  )
}

/** A trophy button that opens the fastest players. */
export function Leaderboard() {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)

  useEffect(() => {
    if (!open) return
    const load = () => void api.leaderboard(5).then((b) => setEntries(b.entries), () => setEntries([]))
    load()
    return on('leaderboard-changed', load)
  }, [open])

  return (
    <div className="play-board">
      <button className="play-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Leaderboard">
        <span aria-hidden="true">🏆</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ol
            className="play-board-list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            aria-label="Fastest players"
          >
            {entries === null && <li className="muted">Loading…</li>}
            {entries?.length === 0 && <li className="muted">No times yet. Collect every star!</li>}
            {entries?.map((e) => (
              <li key={e.rank}>
                <span>{e.rank}</span>
                <strong>{e.name}</strong>
                <time>{formatTime(e.timeMs / 1000)}</time>
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  )
}

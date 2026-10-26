import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GuestbookEntryInput, LIMITS, type GuestbookEntry } from '@portfolio/shared'
import { useApiForm } from '../../hooks/useApiForm'
import { api } from '../../lib/api'
import { ease } from '../../lib/motion'
import { Field, Honeypot } from '../ui/Field'

const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })

/** Approved entries, newest first, with a "load more" and a form to sign. */
export function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const form = useApiForm(GuestbookEntryInput, { name: '', message: '', website: '' }, api.signGuestbook)

  const load = async (from?: number) => {
    try {
      const page = await api.guestbook(from)
      setEntries((e) => (from ? [...e, ...page.entries] : page.entries))
      setCursor(page.nextCursor)
      setState('ready')
    } catch {
      setState('error')
    }
  }
  useEffect(() => {
    void load()
  }, [])

  const message = form.field('message')
  return (
    <div className="form-card guestbook">
      <h3>Guestbook</h3>
      {form.status === 'sent' ? (
        <p className="form-done-inline" role="status">
          Thanks for signing! Your message will show up here once I&rsquo;ve approved it.
        </p>
      ) : (
        <form onSubmit={form.onSubmit} noValidate>
          <Field label="Name" autoComplete="nickname" maxLength={LIMITS.name} error={form.errors.name} {...form.field('name')} />
          <Field
            label="Leave a note"
            multiline
            rows={2}
            error={form.errors.message}
            count={{ value: message.value.length, max: LIMITS.guestbookMessage }}
            {...message}
          />
          <Honeypot {...form.field('website')} />
          {form.status === 'error' && !Object.keys(form.errors).length && (
            <p className="form-error" role="alert">
              {form.message}
            </p>
          )}
          <button className="btn" type="submit" disabled={form.status === 'sending'}>
            {form.status === 'sending' ? 'Signing…' : 'Sign the guestbook'}
          </button>
        </form>
      )}

      <ul className="guestbook-list" aria-label="Guestbook entries" aria-busy={state === 'loading'}>
        {state === 'error' && <li className="guestbook-empty">The guestbook couldn&rsquo;t be loaded right now.</li>}
        {state === 'ready' && entries.length === 0 && <li className="guestbook-empty">No entries yet. Be the first!</li>}
        <AnimatePresence initial={false}>
          {entries.map((e) => (
            <motion.li key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
              <p>{e.message}</p>
              <span>
                {e.name} · <time dateTime={e.createdAt}>{dateFormat.format(new Date(e.createdAt))}</time>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {cursor && (
        <button className="btn guestbook-more" onClick={() => load(cursor)}>
          Load more
        </button>
      )}
    </div>
  )
}

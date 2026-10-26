import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { profile } from '../../content/profile'
import { useSiteEvent } from '../../hooks/useSiteEvent'
import type { ShowToast } from '../../hooks/useToast'
import { copyText } from '../../lib/platform'
import { buildCommands, searchCommands, type Command } from './commands'

/** ⌘K / Ctrl+K palette: fuzzy search, arrow-key navigation, Enter to run. */
export function CommandPalette({ onToast }: { onToast: ShowToast }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const commands = useMemo(() => buildCommands(async () => onToast((await copyText(profile.email)) ? 'Email copied' : profile.email)), [onToast])
  const results = useMemo(() => searchCommands(commands, query), [commands, query])

  useSiteEvent('open-palette', () => setOpen(true))
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setIndex(0)
    const t = setTimeout(() => input.current?.focus(), 10)
    return () => clearTimeout(t)
  }, [open])
  useEffect(() => setIndex(0), [query])
  useEffect(() => {
    list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [index])

  const run = (c: Command) => {
    setOpen(false)
    setTimeout(c.run, 50)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, results.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    }
    const current = results[index]
    if (e.key === 'Enter' && current) run(current)
  }

  let lastGroup: string | null = null
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="backdrop palette-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.div
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            <input
              ref={input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search projects, sections, links..."
              aria-label="Search"
              role="combobox"
              aria-expanded="true"
              aria-controls="palette-list"
              aria-activedescendant={results[index] ? `cmd-${index}` : undefined}
            />
            <ul className="palette-list" id="palette-list" role="listbox" ref={list}>
              {results.length === 0 && <li className="palette-empty">No results for “{query}”</li>}
              {results.map((c, i) => {
                const header = c.group !== lastGroup ? c.group : null
                lastGroup = c.group
                return (
                  <li key={c.group + c.label} role="presentation">
                    {header && <p className="palette-group">{header}</p>}
                    <button id={`cmd-${i}`} role="option" aria-selected={i === index} data-active={i === index} onMouseMove={() => setIndex(i)} onClick={() => run(c)}>
                      {i === index && <motion.span layoutId="palette-hl" className="palette-hl" transition={{ type: 'spring', stiffness: 600, damping: 40 }} />}
                      <span className="palette-label">{c.label}</span>
                      {c.hint && <small>{c.hint}</small>}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="palette-foot">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> navigate
              </span>
              <span>
                <kbd>↵</kbd> open
              </span>
              <span>
                <kbd>esc</kbd> close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

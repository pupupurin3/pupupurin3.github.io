import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { profile, projects } from '../data/content'

export const modKey = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'

const go = (id) => () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

function buildCommands(copyEmail) {
  return [
    { group: 'Navigate', label: 'Home', run: go('home') },
    { group: 'Navigate', label: 'Work', run: go('work') },
    { group: 'Navigate', label: 'Lab', run: go('lab') },
    { group: 'Navigate', label: 'About', run: go('about') },
    { group: 'Navigate', label: 'Contact', run: go('contact') },
    { group: 'Play', label: 'Play the portfolio game', hint: 'P', run: () => window.dispatchEvent(new Event('toggle-game')) },
    ...projects.map((p) => ({
      group: 'Projects',
      label: p.title,
      hint: p.category,
      run: () => { go('work')(); window.dispatchEvent(new CustomEvent('open-project', { detail: p.title })) },
    })),
    { group: 'Links', label: 'Copy email address', hint: profile.email, run: copyEmail },
    { group: 'Links', label: 'Open GitHub', hint: 'github.com/pupupurin3', run: () => window.open(profile.github, '_blank', 'noopener') },
  ]
}

// Scores a fuzzy match: every query character must appear in order;
// consecutive and word-start hits score higher.
function score(text, query) {
  if (!query) return 1
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  let ti = 0
  let s = 0
  let streak = 0
  for (const ch of q) {
    const found = t.indexOf(ch, ti)
    if (found === -1) return 0
    streak = found === ti ? streak + 1 : 0
    s += 1 + streak * 2 + (found === 0 || t[found - 1] === ' ' ? 3 : 0)
    ti = found + 1
  }
  return s
}

// ⌘K / Ctrl+K palette: fuzzy search, arrow-key navigation, Enter to run.
export default function CommandPalette({ onToast }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const input = useRef()
  const list = useRef()

  const commands = useMemo(() => buildCommands(() => {
    navigator.clipboard?.writeText(profile.email).then(() => onToast?.('Email copied'), () => onToast?.(profile.email))
  }), [onToast])

  const results = useMemo(
    () => commands
      .map((c) => ({ c, s: Math.max(score(c.label, query), score(c.hint || '', query) * 0.6) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => (query ? b.s - a.s : 0))
      .map((r) => r.c),
    [commands, query],
  )

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((v) => !v) }
      else if (e.key === 'Escape') setOpen(false)
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-palette', onOpen)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('open-palette', onOpen) }
  }, [])

  useEffect(() => {
    if (open) { setQuery(''); setIndex(0); setTimeout(() => input.current?.focus(), 10) }
  }, [open])
  useEffect(() => setIndex(0), [query])
  useEffect(() => {
    list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [index])

  const run = (c) => { setOpen(false); setTimeout(c.run, 50) }
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[index]) run(results[index])
  }

  let lastGroup = null
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
                    <button
                      id={`cmd-${i}`}
                      role="option"
                      aria-selected={i === index}
                      data-active={i === index}
                      onMouseMove={() => setIndex(i)}
                      onClick={() => run(c)}
                    >
                      {i === index && <motion.span layoutId="palette-hl" className="palette-hl" transition={{ type: 'spring', stiffness: 600, damping: 40 }} />}
                      <span className="palette-label">{c.label}</span>
                      {c.hint && <small>{c.hint}</small>}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

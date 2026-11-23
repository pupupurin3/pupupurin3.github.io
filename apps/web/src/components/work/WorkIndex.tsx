import { motion } from 'framer-motion'
import { CATEGORIES } from '@portfolio/shared'
import { projects } from '../../content/projects'
import { emit } from '../../lib/events'
import { ease } from '../../lib/motion'

const LABELS: Record<(typeof CATEGORIES)[number], string> = { '3D': '3D models', Games: 'Games', Simulations: 'Simulations', Apps: 'Apps' }
const ORDER = ['3D', 'Games', 'Simulations', 'Apps'] as const

/**
 * Every project as a slanted index, grouped by kind: each row steps a little
 * further right, so the list leans like the panels above it.
 */
export function WorkIndex() {
  return (
    <div className="index">
      {ORDER.map((cat) => {
        const list = projects.filter((p) => p.category === cat)
        if (!list.length) return null
        return (
          <div key={cat} className="index-group">
            <h3 className="index-cat">{LABELS[cat]}<span>{list.length}</span></h3>
            <ul>
              {list.map((p, i) => {
                return (
                  <motion.li
                    key={p.slug}
                    style={{ '--i': i } as React.CSSProperties}
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.6, ease }}
                  >
                    <button className="index-row" onClick={() => emit('open-project', p.slug)}>
                      <span className="index-title">{p.title}</span>
                      <span className="index-tags">{p.tags.join(' · ')}</span>
                      <span className="index-status">{p.status ?? ''}</span>
                    </button>
                  </motion.li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

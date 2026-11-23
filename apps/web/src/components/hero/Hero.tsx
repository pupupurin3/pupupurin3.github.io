import { useState } from 'react'
import { motion } from 'framer-motion'
import { profile } from '../../content/profile'
import { heroModels } from '../../content/showcase'
import { emit } from '../../lib/events'
import { ease } from '../../lib/motion'
import { ModelViewer } from '../three/LazyModelViewer'
import { SECTIONS } from '../layout/Nav'

// One letter that fades up out of a soft blur.
function Letter({ ch, start, delay }: { ch: string; start: boolean; delay: number }) {
  return (
    <motion.span
      className="hero-letter"
      initial={{ opacity: 0, y: '0.3em', filter: 'blur(8px)' }}
      animate={start ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 1, delay, ease }}
    >
      {ch}
    </motion.span>
  )
}

function FadeLetters({ words, start, delay = 0, step = 0.045, className }: { words: string[]; start: boolean; delay?: number; step?: number; className: string }) {
  let i = 0
  return words.map((word, w) => (
    <span key={w} className={className}>
      {[...word].map((ch) => <Letter key={i} ch={ch} start={start} delay={delay + i++ * step} />)}
    </span>
  ))
}

/**
 * Editorial hero: name and links on the left, a slanted panel on the right
 * with my latest 3D work live in a viewer, and a "new" strip pointing at what
 * I'm working on now.
 */
export function Hero({ start }: { start: boolean }) {
  const [modelIdx, setModelIdx] = useState(0)
  const current = heroModels[modelIdx]!
  const fade = (delay: number, y = 14) => ({
    initial: { opacity: 0, y },
    animate: start ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.9, delay, ease },
  })
  const [given = '', family = ''] = profile.name.toUpperCase().split(' ')

  return (
    <section id="home" className="hero">
      <div className="hero-text">
        <motion.p className="hero-kicker" {...fade(0.1, 6)}>
          <span>Portfolio</span>
          <span>{new Date().getFullYear()}</span>
        </motion.p>
        <h1 className="hero-title" aria-label={profile.name}>
          <FadeLetters words={[given, family]} start={start} delay={0.2} className="hero-word" />
        </h1>
        <div className="hero-sub">
          <motion.span className="hero-rule" aria-hidden="true" initial={{ scaleX: 0 }} animate={start ? { scaleX: 1 } : {}} transition={{ duration: 1.2, delay: 0.7, ease }} />
          <motion.p className="hero-kanji" lang="ja" {...fade(0.9, 0)}>{profile.nameJa}</motion.p>
        </div>
        <motion.p className="hero-roles" {...fade(1.0)}>{profile.roles.join(' / ')}</motion.p>

        <nav className="hero-links" aria-label="Sections">
          {SECTIONS.map(([id, label], i) => (
            <motion.a key={id} href={`#${id}`} {...fade(1.1 + i * 0.07)}>
              <span className="hero-link-no">{String(i + 1).padStart(2, '0')}</span>
              {label}
            </motion.a>
          ))}
        </nav>

        <motion.div className="hero-cta" {...fade(1.5)}>
          <a href="#work" className="btn primary">View work</a>
          <button className="btn" onClick={() => emit('toggle-game')}>▶ Play the site</button>
        </motion.div>
      </div>

      <motion.div
        className="hero-panel"
        initial={{ clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' }}
        animate={start ? { clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 0% 100%)' } : {}}
        transition={{ duration: 1.3, delay: 0.15, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="hero-panel-bg" aria-hidden="true" style={{ backgroundImage: `url(${profile.heroPhoto})` }} />
        <span className="hero-panel-no" aria-hidden="true">{String(modelIdx + 1).padStart(2, '0')}</span>
        {start && <ModelViewer key={current.model} model={current.model} className="hero-viewer" />}
        <div className="hero-panel-foot">
          <div className="hero-models" role="tablist" aria-label="3D models">
            {heroModels.map((m, i) => (
              <button key={m.name} role="tab" aria-selected={i === modelIdx} className={i === modelIdx ? 'on' : ''} onClick={() => setModelIdx(i)}>
                {m.name}
              </button>
            ))}
          </div>
          <p className="hero-model-note">{current.note}</p>
        </div>
      </motion.div>

      <motion.button className="hero-new" onClick={() => emit('open-project', 'angela-toy-figure')} {...fade(1.7, 20)}>
        <span className="hero-new-tag">New</span>
        <span>Angela, a chibi toy figure in Maya + Arnold</span>
        <span aria-hidden="true">→</span>
      </motion.button>
    </section>
  )
}

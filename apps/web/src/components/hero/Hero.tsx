import { motion } from 'framer-motion'
import { profile } from '../../content/profile'
import { emit } from '../../lib/events'
import { ease } from '../../lib/motion'

// One letter that fades up out of a soft blur.
function Letter({ ch, start, delay }: { ch: string; start: boolean; delay: number }) {
  return (
    <motion.span
      className="hero-letter"
      initial={{ opacity: 0, y: '0.12em', filter: 'blur(10px)' }}
      animate={start ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 1.3, delay, ease }}
    >
      {ch}
    </motion.span>
  )
}

// Splits words into letters with a running stagger across the whole line.
function FadeLetters({ words, start, delay = 0, step = 0.055, className }: { words: string[]; start: boolean; delay?: number; step?: number; className: string }) {
  let i = 0
  return words.map((word, w) => (
    <span key={w} className={className}>
      {[...word].map((ch) => <Letter key={i} ch={ch} start={start} delay={delay + i++ * step} />)}
    </span>
  ))
}

// A thin line that draws itself in from one end.
function Rule({ className, start, delay, vertical = false }: { className: string; start: boolean; delay: number; vertical?: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`hero-line ${className}`}
      style={{ transformOrigin: vertical ? '50% 0' : '0 50%' }}
      initial={vertical ? { scaleY: 0 } : { scaleX: 0 }}
      animate={start ? (vertical ? { scaleY: 1 } : { scaleX: 1 }) : {}}
      transition={{ duration: 1.6, delay, ease }}
    />
  )
}

export function Hero({ start }: { start: boolean }) {
  const fade = (delay: number, y = 12) => ({
    initial: { opacity: 0, y },
    animate: start ? { opacity: 1, y: 0 } : {},
    transition: { duration: 1.1, delay, ease },
  })
  const [given = '', family = ''] = profile.name.toUpperCase().split(' ')

  return (
    <section id="home" className="hero">
      {/* The photo fades in together with the letters. */}
      <motion.picture
        className="hero-photo"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={start ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 2.6, ease }}
      >
        <source media="(max-width: 640px)" srcSet={profile.heroPhotoTall} />
        <img src={profile.heroPhoto} alt="Refinery chimneys by the sea, seen from a train window and washed out in pale blue" />
      </motion.picture>

      <motion.div
        className="sunrays"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={start ? { opacity: 1 } : {}}
        transition={{ duration: 3, delay: 0.8 }}
      >
        <span className="sunrays-glow" />
        <span className="sunrays-beams" />
        <span className="sunrays-beams sunrays-beams-2" />
      </motion.div>

      <Rule className="hero-line-left" vertical start={start} delay={1.2} />
      <Rule className="hero-line-top" start={start} delay={1.0} />

      <div className="hero-head">
        <motion.p className="hero-tag" {...fade(0.2, 6)}>{profile.roles.join(' · ')}</motion.p>
        <h1 className="hero-title" aria-label={profile.name}>
          <FadeLetters words={[given, family]} start={start} delay={0.3} className="hero-word" />
        </h1>
        <div className="hero-sub">
          <Rule className="hero-line-kanji" start={start} delay={1.4} />
          <p className="hero-kanji" lang="ja" aria-label={`${profile.nameJa} (${profile.name} in Japanese)`}>
            <FadeLetters words={profile.nameJa.split(' ')} start={start} delay={1.1} step={0.12} className="hero-word" />
          </p>
        </div>
      </div>

      <div className="hero-foot">
        <motion.p className="hero-intro" {...fade(1.9)}>{profile.intro}</motion.p>
        <motion.div className="hero-cta" {...fade(2.05)}>
          <a href="#work" className="btn primary">View work</a>
          <a href="#lab" className="btn">Explore the lab</a>
          <button className="btn" onClick={() => emit('toggle-game')}>▶ Play the site</button>
        </motion.div>
      </div>
    </section>
  )
}

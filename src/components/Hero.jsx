import { Fragment, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Viewfinder from '../tv/Viewfinder'
import { modKey } from './CommandPalette'
import { profile, projects } from '../data/content'

const ease = [0.22, 1, 0.36, 1]

// Splits text into words that slide up from behind a mask, one after another.
function MaskedWords({ text, start, delay = 0 }) {
  return text.split(' ').map((word, i) => (
    <Fragment key={i}>
      <span className="mask">
        <motion.span
          initial={{ y: '110%' }}
          animate={start ? { y: 0 } : {}}
          transition={{ duration: 0.9, delay: delay + i * 0.08, ease }}
        >
          {word}
        </motion.span>
      </span>{' '}
    </Fragment>
  ))
}

// A card that tilts toward the pointer in 3D, with a moving highlight.
function TiltCard({ children }) {
  const ref = useRef()
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const rx = useSpring(useTransform(y, [0, 1], [7, -7]), { stiffness: 150, damping: 18 })
  const ry = useSpring(useTransform(x, [0, 1], [-9, 9]), { stiffness: 150, damping: 18 })
  const glare = useTransform([x, y], ([gx, gy]) => `radial-gradient(circle at ${gx * 100}% ${gy * 100}%, rgba(255,255,255,0.10), transparent 55%)`)

  return (
    <motion.div
      ref={ref}
      className="tilt-card"
      style={{ rotateX: rx, rotateY: ry }}
      onPointerMove={(e) => {
        const r = ref.current.getBoundingClientRect()
        x.set((e.clientX - r.left) / r.width)
        y.set((e.clientY - r.top) / r.height)
      }}
      onPointerLeave={() => { x.set(0.5); y.set(0.5) }}
    >
      {children}
      <motion.div className="tilt-glare" style={{ background: glare }} />
    </motion.div>
  )
}

export default function Hero({ start }) {
  const fade = (delay) => ({
    initial: { opacity: 0, y: 16 },
    animate: start ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.7, delay, ease },
  })

  return (
    <section id="home" className="hero">
      <div className="hero-text">
        <motion.p className="eyebrow" {...fade(0.1)}>
          <span className="status-dot" /> {profile.roles.join(' · ')}
        </motion.p>
        <h1><MaskedWords text={profile.name} start={start} delay={0.15} /></h1>
        <p className="hero-headline"><MaskedWords text={profile.headline} start={start} delay={0.4} /></p>
        <motion.p className="hero-intro" {...fade(0.9)}>{profile.intro}</motion.p>
        <motion.div className="hero-cta" {...fade(1.0)}>
          <a href="#work" className="btn primary">View work</a>
          <a href="#lab" className="btn">Explore the lab</a>
          <button className="btn" onClick={() => window.dispatchEvent(new Event('toggle-game'))}>▶ Play the site</button>
        </motion.div>
        <motion.dl className="hero-stats" {...fade(1.1)}>
          <div><dt>Projects</dt><dd>{projects.length}</dd></div>
          <div><dt>Based in</dt><dd>{profile.location}</dd></div>
          <div><dt>Quick search</dt><dd><kbd>{modKey}</kbd><kbd>K</kbd></dd></div>
        </motion.dl>
      </div>

      <motion.figure
        className="hero-figure"
        initial={{ opacity: 0, scale: 0.94, clipPath: 'inset(12% 12% 12% 12% round 20px)' }}
        animate={start ? { opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0% round 20px)' } : {}}
        transition={{ duration: 1.1, delay: 0.3, ease }}
      >
        <TiltCard>
          <div className="hero-grid" />
          <Viewfinder />
          <img src={profile.heroImage} alt="3D diorama of a street corner with a utility pole, balcony, plants and an air conditioner" />
        </TiltCard>
        <figcaption>{profile.heroCaption}</figcaption>
      </motion.figure>
    </section>
  )
}

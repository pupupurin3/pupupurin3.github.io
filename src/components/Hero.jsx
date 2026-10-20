import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { profile } from '../data/content'

function TypedRoles({ roles, start }) {
  const [i, setI] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!start) return
    const word = roles[i % roles.length]
    let delay = deleting ? 45 : 90
    if (!deleting && text === word) delay = 1400
    const t = setTimeout(() => {
      if (!deleting && text === word) setDeleting(true)
      else if (deleting && text === '') { setDeleting(false); setI((v) => v + 1) }
      else setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1))
    }, delay)
    return () => clearTimeout(t)
  }, [text, deleting, i, roles, start])

  return <span className="typed">{text}<span className="caret">_</span></span>
}

// Sticker-style pop-in once the loader has finished.
const pop = (start, delay, rotate = 0) => ({
  initial: { scale: 0, rotate: rotate - 20, opacity: 0 },
  animate: start ? { scale: 1, rotate, opacity: 1 } : {},
  transition: { delay, type: 'spring', stiffness: 380, damping: 16 },
})

// Street-poster hero: the diorama render sits centre stage over a slanted
// acid band and giant outlined name, with layers drifting against the mouse.
export default function Hero({ start }) {
  const ref = useRef()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 80, damping: 20 })
  const sy = useSpring(my, { stiffness: 80, damping: 20 })
  const backX = useTransform(sx, (v) => v * -30)
  const backY = useTransform(sy, (v) => v * -16)
  const midX = useTransform(sx, (v) => v * 14)
  const midY = useTransform(sy, (v) => v * 10)
  const tilt = useTransform(sx, (v) => v * 6)

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const [first, last] = profile.name.toUpperCase().split(' ')

  return (
    <section id="home" className="hero" ref={ref} onMouseMove={onMove}>
      <div className="halftone" />
      <motion.div
        className="hero-band"
        initial={{ scaleX: 0 }}
        animate={start ? { scaleX: 1 } : {}}
        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      />
      <motion.div className="hero-bigname" style={{ x: backX, y: backY }} aria-hidden="true">
        <motion.span initial={{ x: '-30%', opacity: 0 }} animate={start ? { x: 0, opacity: 1 } : {}} transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>{first}</motion.span>
        <motion.span initial={{ x: '30%', opacity: 0 }} animate={start ? { x: 0, opacity: 1 } : {}} transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>{last}</motion.span>
      </motion.div>

      <motion.div className="hero-stage" style={{ x: midX, y: midY, rotate: tilt }}>
        <motion.div className="hero-disc" {...pop(start, 0.45)} />
        <motion.img
          src="/img/hero-model.png"
          alt="Noah's 3D diorama of a street corner with a utility pole, balcony and air conditioner"
          className="hero-model"
          initial={{ y: 60, opacity: 0 }}
          animate={start ? { y: [0, -12, 0], opacity: 1 } : {}}
          transition={{ opacity: { delay: 0.55, duration: 0.4 }, y: { delay: 0.55, duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
        />
        <motion.span className="sticker s1" {...pop(start, 0.9, -8)}>3D ARTIST</motion.span>
        <motion.span className="sticker s2" {...pop(start, 1.0, 6)}>GAME DEV</motion.span>
        <motion.span className="sticker s3" {...pop(start, 1.1, -4)}>★ {profile.handle.toUpperCase()}</motion.span>
      </motion.div>

      <div className="hero-copy">
        <motion.h1
          initial={{ opacity: 0, x: -40, skewX: -12 }}
          animate={start ? { opacity: 1, x: 0, skewX: -8 } : {}}
          transition={{ delay: 0.7, type: 'spring', stiffness: 200, damping: 20 }}
        >
          {profile.name}
        </motion.h1>
        <motion.p className="hero-role" initial={{ opacity: 0 }} animate={start ? { opacity: 1 } : {}} transition={{ delay: 1.1 }}>
          <span className="role-tag">NOW SHOWING</span> <TypedRoles roles={profile.roles} start={start} />
        </motion.p>
        <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={start ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.3 }}>
          <a href="#projects" className="btn primary">Browse the tapes</a>
          <a href="#gallery" className="btn">3D workshop</a>
        </motion.div>
      </div>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {Array.from({ length: 2 }, (_, k) => (
            <span key={k}>
              {['NEW RELEASES', 'GAME DEV', '3D MODELLING', 'TAPES IN STOCK', 'OPEN 24/7', 'PURIN TAPE SHOP'].map((t) => (
                <span key={t} className="ticker-item">{t}<i>◆</i></span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'

const PASSAGE =
  'Good interfaces feel inevitable. Every animation here is tied to something you do, a scroll, a drag or a hover, so motion explains what changed instead of decorating it.'

function Word({ children, range, progress }: { children: ReactNode; range: [number, number]; progress: MotionValue<number> }) {
  const k = useTransform(progress, (p) => Math.min(Math.max((p - range[0]) / (range[1] - range[0]), 0), 1))
  const opacity = useTransform(k, (v) => 0.15 + v * 0.85)
  const y = useTransform(k, (v) => (1 - v) * 6)
  return (
    <motion.span style={{ opacity, y }} className="scroll-word">
      {children}{' '}
    </motion.span>
  )
}

// Words brighten in sequence as the box is scrolled: progress comes from the
// scroll container itself, not the page.
export function ScrollReveal() {
  const box = useRef<HTMLDivElement>(null)
  const target = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ container: box, target, offset: ['start end', 'end end'] })
  const words = PASSAGE.split(' ')
  const bar = useSpring(scrollYProgress, { stiffness: 200, damping: 30 })
  return (
    <div className="scroll-demo" ref={box}>
      <motion.div className="scroll-demo-bar" style={{ scaleX: bar }} />
      <p className="scroll-hint">Scroll inside this box ↓</p>
      <div className="scroll-spacer" />
      <p className="scroll-passage" ref={target}>
        {words.map((w, i) => (
          <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
            {w}
          </Word>
        ))}
      </p>
    </div>
  )
}

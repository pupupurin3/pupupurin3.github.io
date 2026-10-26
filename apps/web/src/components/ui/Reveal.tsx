import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { ease } from '../../lib/motion'

const tags = { div: motion.div, p: motion.p, h2: motion.h2, h3: motion.h3 }

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
  as?: keyof typeof tags
}

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({ children, delay = 0, className, as = 'div' }: RevealProps) {
  const M = tags[as]
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </M>
  )
}

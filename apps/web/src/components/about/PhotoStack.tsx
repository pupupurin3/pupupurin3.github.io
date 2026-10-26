import { useState } from 'react'
import { motion } from 'framer-motion'
import { aboutPhotos } from '../../content/about'
import { Reveal } from '../ui/Reveal'

// Photos as overlapping sticker cards. Hover lifts and straightens one, click
// (or a quick tap) brings it to the front, and each can be dragged and flicked
// around, springing back to its place on release.
// Positions are percentages of the stack so it scales with its column.
const POSE = [
  { x: 0, y: 28, r: -4, w: 64 },
  { x: 42, y: 56, r: 3, w: 56 },
  { x: 52, y: 0, r: 4, w: 46 },
] as const

export function PhotoStack() {
  const [order, setOrder] = useState(() => aboutPhotos.map((_, i) => i))
  const front = (i: number) => setOrder((o) => [...o.filter((j) => j !== i), i])
  return (
    <Reveal className="photo-stack">
      {aboutPhotos.map((ph, i) => {
        const pose = POSE[i % POSE.length]!
        return (
          <motion.figure
            key={ph.src}
            className="sticker"
            style={{ left: `${pose.x}%`, top: `${pose.y}%`, width: `${pose.w}%`, aspectRatio: `${ph.w} / ${ph.h}`, zIndex: order.indexOf(i) + 1 }}
            initial={{ rotate: pose.r * 2.2, scale: 0.9 }}
            whileInView={{ rotate: pose.r, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            whileHover={{ rotate: 0, scale: 1.04, y: -6 }}
            whileDrag={{ scale: 1.08, rotate: pose.r * 0.4, cursor: 'grabbing' }}
            drag
            dragSnapToOrigin
            dragElastic={0.5}
            dragTransition={{ bounceStiffness: 260, bounceDamping: 18 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22, delay: i * 0.08 }}
            onDragStart={() => front(i)}
            onTap={() => front(i)}
          >
            <span className="sticker-back" style={{ clipPath: ph.backing }} aria-hidden="true" />
            <img src={ph.src} alt={ph.alt} loading="lazy" draggable="false" style={ph.clip ? { clipPath: ph.clip } : undefined} />
          </motion.figure>
        )
      })}
    </Reveal>
  )
}

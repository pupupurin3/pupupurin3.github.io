import { useRef, useState } from 'react'
import { motion, Reorder, useMotionValue, useTransform } from 'framer-motion'

const TASKS = ['Prototype the movement', 'Model the level', 'Write the shaders', 'Playtest with friends', 'Ship it']

// Drag-to-reorder list plus a free-floating card that springs back with
// velocity-aware physics.
export function SpringPhysics() {
  const [items, setItems] = useState(TASKS)
  const area = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-150, 150], [-12, 12])
  return (
    <div className="physics">
      <div>
        <p className="demo-label">Drag to reorder</p>
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="reorder">
          {items.map((t, i) => (
            <Reorder.Item key={t} value={t} className="reorder-item" whileDrag={{ scale: 1.03, boxShadow: '0 12px 30px rgba(0,0,0,0.45)' }}>
              <span className="reorder-no">{String(i + 1).padStart(2, '0')}</span>
              {t}
              <span className="grip" aria-hidden="true">
                ⋮⋮
              </span>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
      <div>
        <p className="demo-label">Throw the card</p>
        <div className="throw-area" ref={area}>
          <motion.div
            className="throw-card"
            drag
            dragConstraints={area}
            dragElastic={0.25}
            dragTransition={{ bounceStiffness: 300, bounceDamping: 14 }}
            whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
            style={{ x, rotate }}
          >
            <span>Purin</span>
            <small>drag me</small>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

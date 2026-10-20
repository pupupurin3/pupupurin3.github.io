import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import * as THREE from 'three'
import Cassette, { TAPE } from './Cassette'
import ModelViewer from './ModelViewer'
import { categories, profile, projects, tapeModel } from '../data/content'

const GAP_X = 1.28
const ROW_H = 1.02
const LEAN = -0.14

function useColumns() {
  const get = () => (window.innerWidth < 640 ? 3 : window.innerWidth < 1100 ? 4 : 5)
  const [cols, setCols] = useState(get)
  useEffect(() => {
    const on = () => setCols(get())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return cols
}

function shelfSize(cols, rows) {
  return { w: cols * GAP_X + 0.5, h: rows * ROW_H + 0.35 }
}

// Fits the camera so the whole shelf fills the canvas vertically.
function CameraRig({ h }) {
  const { camera } = useThree()
  useEffect(() => {
    const dist = (h / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.04
    camera.position.set(0, 0.25, dist)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, h])
  return null
}

function Shelf({ cols, rows }) {
  const { w, h } = shelfSize(cols, rows)
  const planks = Array.from({ length: rows + 1 }, (_, r) => h / 2 - 0.12 - r * ROW_H)
  return (
    <group>
      <mesh position={[0, 0, -0.35]} receiveShadow>
        <boxGeometry args={[w, h, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * w) / 2, 0, -0.1]} castShadow>
          <boxGeometry args={[0.1, h, 0.55]} />
          <meshStandardMaterial color="#262626" roughness={0.7} />
        </mesh>
      ))}
      {planks.slice(1).map((y, i) => (
        <group key={i} position={[0, y, -0.08]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[w, 0.07, 0.6]} />
            <meshStandardMaterial color="#2b2b2b" roughness={0.7} />
          </mesh>
          {/* Acid-yellow price rail along the front edge */}
          <mesh position={[0, -0.005, 0.305]}>
            <boxGeometry args={[w - 0.1, 0.06, 0.012]} />
            <meshStandardMaterial color="#d7ff1f" emissive="#d7ff1f" emissiveIntensity={0.15} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, planks[0], -0.08]}>
        <boxGeometry args={[w, 0.07, 0.6]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
    </group>
  )
}

// One tape on the shelf. It eases toward a target pose that depends on
// whether it is hovered, open, filtered out (flipped around), or not yet
// dropped in by the intro animation.
function ShelfTape({ project, index, cols, rows, state, onHover, onOpen, shown }) {
  const group = useRef()
  const spin = useRef(false)
  const col = index % cols
  const row = Math.floor(index / cols)
  const { h } = shelfSize(cols, rows)
  const baseX = (col - (cols - 1) / 2) * GAP_X
  const baseY = h / 2 - 0.12 - (row + 1) * ROW_H + 0.035 + TAPE.h / 2 + 0.01
  const t0 = useRef(null)

  useFrame((s, dt) => {
    const g = group.current
    if (!g) return
    if (shown && t0.current === null) t0.current = s.clock.elapsedTime
    const since = t0.current === null ? -1 : s.clock.elapsedTime - t0.current - index * 0.06
    const dropped = since > 0
    const { hovered, open, dimmed } = state
    spin.current = hovered || open
    const ty = dropped ? baseY + (hovered ? 0.06 : 0) + (open ? 0.1 : 0) : baseY + 2.5
    const tz = open ? 0.55 : hovered ? 0.22 : dimmed ? -0.18 : 0
    const rx = hovered || open ? 0 : LEAN
    const ry = dimmed ? Math.PI : hovered ? Math.sin(s.clock.elapsedTime * 3) * 0.06 : 0
    g.position.x = baseX
    g.position.y = THREE.MathUtils.damp(g.position.y, ty, dropped ? 9 : 100, dt)
    g.position.z = THREE.MathUtils.damp(g.position.z, tz, 8, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, rx, 8, dt)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ry, 7, dt)
  })

  return (
    <group
      ref={group}
      position={[baseX, baseY + 2.5, 0]}
      onPointerOver={(e) => { e.stopPropagation(); onHover(project.title); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); onOpen(project) }}
    >
      <Cassette project={project} tapeModel={tapeModel} spin={spin} />
    </group>
  )
}

function TapeViewer({ project }) {
  const spin = useRef(true)
  return (
    <div className="model-viewer tape-viewer">
      <Canvas camera={{ position: [0, 0.1, 1.9], fov: 35 }} dpr={[1, 2]}>
        <color attach="background" args={['#141414']} />
        <hemisphereLight args={['#ffffff', '#222', 1]} />
        <directionalLight position={[2, 3, 3]} intensity={2.4} />
        <Suspense fallback={null}>
          <group rotation={[0.1, -0.3, 0]}>
            <Cassette project={project} tapeModel={tapeModel} spin={spin} />
          </group>
        </Suspense>
        <ContactShadows position={[0, -0.45, 0]} opacity={0.5} scale={3} blur={2.5} />
        <OrbitControls autoRotate autoRotateSpeed={1.5} enablePan={false} minDistance={1.1} maxDistance={4} />
      </Canvas>
      <div className="viewer-hint">Drag to turn the tape</div>
    </div>
  )
}

function projectLinks(p) {
  const links = [...(p.links || [])]
  if (p.repo) links.push({ label: 'Source on GitHub', url: `${profile.github}/${p.repo}` })
  return links
}

function NowPlaying({ project, onClose }) {
  const tabs = ['Tape', project.image && 'Screenshot', project.model && '3D model'].filter(Boolean)
  const [tab, setTab] = useState(tabs[0])
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal now-playing"
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        initial={{ x: 80, opacity: 0, skewX: -6 }}
        animate={{ x: 0, opacity: 1, skewX: 0 }}
        exit={{ x: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="np-head">
          <span className="np-badge"><span className="rec-dot" /> Now playing</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="np-media">
          {tab === 'Tape' && <TapeViewer project={project} />}
          {tab === 'Screenshot' && <img src={project.image} alt={`${project.title} screenshot`} />}
          {tab === '3D model' && <ModelViewer model={project.model} />}
          {tabs.length > 1 && (
            <div className="np-tabs">
              {tabs.map((t) => (
                <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>
          )}
        </div>
        <div className="modal-body">
          <p className="kicker">{project.category}{project.status ? ` · ${project.status}` : ''}</p>
          <h3>{project.title}</h3>
          <p>{project.blurb}</p>
          <div className="tags">{project.tags.map((t) => <span key={t}>{t}</span>)}</div>
          <div className="modal-links">
            {projectLinks(project).map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn primary">▶ {l.label}</a>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function TapeShelf() {
  const cols = useColumns()
  const rows = Math.ceil(projects.length / cols)
  const { w, h } = shelfSize(cols, rows)
  const [filter, setFilter] = useState('All')
  const [hovered, setHovered] = useState(null)
  const [open, setOpen] = useState(null)
  const wrap = useRef()
  const inView = useInView(wrap, { margin: '100px' })
  const seen = useInView(wrap, { once: true, amount: 0.3 })
  const matches = (p) => filter === 'All' || p.category === filter || (filter === '3D' && p.model)
  const count = useMemo(() => projects.filter(matches).length, [filter])

  return (
    <div className="tape-shop">
      <div className="filters" role="tablist" aria-label="Filter projects">
        {categories.map((c) => (
          <button key={c} role="tab" aria-selected={filter === c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>
            {filter === c && <motion.span layoutId="filter-pill" className="filter-pill" />}
            <span className="filter-label">{c}</span>
          </button>
        ))}
      </div>
      <div className="shop-grid">
        <div className="shelf-frame" ref={wrap} style={{ aspectRatio: `${w} / ${h}` }}>
          <Canvas shadows dpr={[1, 2]} camera={{ fov: 22 }} frameloop={inView ? 'always' : 'never'} onPointerMissed={() => setHovered(null)}>
            <CameraRig h={h} />
            <hemisphereLight args={['#ffffff', '#1a1a1a', 0.8]} />
            <directionalLight position={[2, 4, 5]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
            <pointLight position={[-3, 1, 2]} intensity={6} color="#d7ff1f" />
            <Shelf cols={cols} rows={rows} />
            <Suspense fallback={null}>
              {projects.map((p, i) => (
                <ShelfTape
                  key={p.title}
                  project={p}
                  index={i}
                  cols={cols}
                  rows={rows}
                  shown={seen}
                  state={{ hovered: hovered === p.title, open: open?.title === p.title, dimmed: !matches(p) }}
                  onHover={setHovered}
                  onOpen={setOpen}
                />
              ))}
            </Suspense>
          </Canvas>
          <div className="shelf-sign">TAPE SHELF · {String(count).padStart(2, '0')} IN STOCK</div>
        </div>
        <ol className="tracklist" aria-label="Project list">
          {projects.map((p, i) => (
            <li key={p.title} className={`${matches(p) ? '' : 'out'} ${hovered === p.title ? 'hot' : ''}`}>
              <button
                onMouseEnter={() => setHovered(p.title)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(p.title)}
                onBlur={() => setHovered(null)}
                onClick={() => setOpen(p)}
              >
                <span className="track-no">{String(i + 1).padStart(2, '0')}</span>
                <span className="track-title">{p.title}</span>
                <span className="track-cat" style={{ background: p.color }}>{p.category}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <AnimatePresence>
        {open && <NowPlaying project={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </div>
  )
}

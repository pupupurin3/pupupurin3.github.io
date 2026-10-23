import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import * as THREE from 'three'
import ModelViewer from './ModelViewer'
import { categories, profile, projects } from '../data/content'

// Every project is a book on a wooden shelf. Hovering tips a book out,
// clicking pulls it off the shelf and turns it to show its cover before the
// details open. Filtered-out books slide back into the shelf and go dark.

const ROW_H = 1.85 // vertical spacing between shelves
const DEPTH = 0.86 // how deep the books are, front to back
const PLANK = 0.08
const SIDE = 0.12
const PAPER = '#efe6d2'
const WOOD = '#b78a5c'
const WOOD_DARK = '#9a7250'

// Deterministic per-title variation, so the shelf looks the same every visit.
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296)
}

function bookSize(title) {
  const r = hash(title)
  return { t: 0.3 + r() * 0.16, h: 1.18 + r() * 0.34, band: r() }
}

function useShelfWidth() {
  const get = () => (window.innerWidth < 640 ? 2.7 : window.innerWidth < 1100 ? 4 : 5.4)
  const [w, setW] = useState(get)
  useEffect(() => {
    const on = () => setW(get())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return w
}

// Splits the books into as few rows as fit the shelf width (keeping room for
// a plant at the end of the top row), then balances the rows so no shelf is
// left nearly empty.
const GAP = 0.025
function pack(width) {
  const books = projects.map((p) => ({ project: p, ...bookSize(p.title) }))
  const total = books.reduce((a, b) => a + b.t + GAP, 0)
  let n = Math.max(1, Math.ceil((total + 0.62) / width))
  for (;; n++) {
    const per = Math.ceil(books.length / n)
    const rows = Array.from({ length: n }, (_, r) => books.slice(r * per, (r + 1) * per)).filter((r) => r.length)
    const widths = rows.map((r) => r.reduce((a, b) => a + b.t + GAP, 0) + (r === rows[0] ? 0.62 : 0))
    if (widths.every((w) => w <= width) || n > books.length) {
      return rows.map((r) => {
        let x = 0
        return r.map((b) => { const o = { ...b, x: x + b.t / 2 }; x += b.t + GAP; return o })
      })
    }
  }
}

// Canvas textures for the spine and the front cover.
function makeSpine(p, t, h, band) {
  const W = 128, H = Math.round((W * h) / t)
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  g.fillStyle = p.color; g.fillRect(0, 0, W, H)
  // Cloth texture and a soft shading across the rounded spine.
  const shade = g.createLinearGradient(0, 0, W, 0)
  shade.addColorStop(0, 'rgba(0,0,0,0.28)'); shade.addColorStop(0.35, 'rgba(255,255,255,0.08)'); shade.addColorStop(1, 'rgba(0,0,0,0.32)')
  g.fillStyle = shade; g.fillRect(0, 0, W, H)
  // Gold bands near the top and bottom.
  g.fillStyle = '#e9c46a'
  const by = H * (0.06 + band * 0.04)
  ;[by, H - by - 10].forEach((y) => { g.fillRect(0, y, W, 4); g.fillRect(0, y + 9, W, 2) })
  // Title runs top to bottom, like an English-language spine.
  g.save()
  g.translate(W / 2, H * 0.46)
  g.rotate(Math.PI / 2)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  let size = 58
  g.font = `600 ${size}px Inter, system-ui, sans-serif`
  while (g.measureText(p.title).width > H * 0.6 && size > 22) { size -= 2; g.font = `600 ${size}px Inter, system-ui, sans-serif` }
  g.fillText(p.title, 0, 0)
  g.restore()
  g.fillStyle = 'rgba(255,255,255,0.75)'
  g.font = '500 22px "JetBrains Mono", monospace'
  g.textAlign = 'center'
  g.fillText(p.category.slice(0, 4).toUpperCase(), W / 2, H - by - 30)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function makeCover(p, h) {
  const W = 512, H = Math.round((W * h) / DEPTH)
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const draw = (img) => {
    g.fillStyle = p.color; g.fillRect(0, 0, W, H)
    const shade = g.createLinearGradient(0, 0, W, H)
    shade.addColorStop(0, 'rgba(255,255,255,0.12)'); shade.addColorStop(1, 'rgba(0,0,0,0.3)')
    g.fillStyle = shade; g.fillRect(0, 0, W, H)
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 14, H) // hinge
    if (img) {
      const iw = W - 120, ih = Math.min(iw * (img.height / img.width), H * 0.45)
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(64, 64, iw, ih)
      g.drawImage(img, 60, 60, iw, ih)
    }
    g.fillStyle = '#fff'
    g.textAlign = 'left'
    g.font = '600 64px Inter, system-ui, sans-serif'
    const words = p.title.split(' ')
    let line = '', y = H * (img ? 0.66 : 0.4)
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w
      if (g.measureText(test).width > W - 110 && line) { g.fillText(line, 60, y); line = w; y += 72 } else line = test
    })
    g.fillText(line, 60, y)
    g.fillStyle = 'rgba(255,255,255,0.7)'
    g.font = '500 26px "JetBrains Mono", monospace'
    g.fillText(`${p.category}${p.status ? ' · ' + p.status : ''}`.toUpperCase(), 60, H - 70)
    tex.needsUpdate = true
  }
  draw(null)
  if (p.image) {
    const img = new Image()
    img.onload = () => draw(img)
    img.src = p.image
  }
  return tex
}

// The six faces of a box, in three.js order: +x (front cover), -x (back
// cover), +y (top of the pages), -y, +z (spine, facing out), -z (fore-edge).
function useBookMaterials(p, t, h, band) {
  const mats = useMemo(() => {
    const cloth = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.8 })
    const pages = new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.95 })
    return [
      new THREE.MeshStandardMaterial({ map: makeCover(p, h), roughness: 0.7 }),
      cloth,
      pages,
      pages,
      new THREE.MeshStandardMaterial({ map: makeSpine(p, t, h, band), roughness: 0.75 }),
      pages,
    ]
  }, [p, t, h, band])
  useEffect(() => () => mats.forEach((m) => { m.map?.dispose(); m.dispose() }), [mats])
  return mats
}

function Book({ book, y, width, index, state, shown, onHover, onOpen }) {
  const { project: p, t, h, band } = book
  const group = useRef()
  const mats = useBookMaterials(p, t, h, band)
  const baseX = book.x - width / 2
  const t0 = useRef(null)
  const tint = useRef(new THREE.Color())
  const white = useMemo(() => new THREE.Color('#ffffff'), [])
  const dark = useMemo(() => new THREE.Color('#4a4a4a'), [])
  const clothColor = useMemo(() => new THREE.Color(p.color), [p.color])
  const clothTint = useRef(new THREE.Color())

  useFrame((s, dt) => {
    const g = group.current
    if (!g) return
    if (shown && t0.current === null) t0.current = s.clock.elapsedTime
    const since = t0.current === null ? -1 : s.clock.elapsedTime - t0.current - index * 0.05
    const placed = since > 0
    const { hovered, open, dimmed } = state
    // Target pose: pulled out and turned to the camera when open, tipped
    // forward from its bottom edge when hovered, pushed back when filtered.
    const tx = placed ? baseX : baseX - width - 2
    const ty = y + (open ? 0.35 : 0)
    const tz = open ? 1.25 : hovered ? 0.3 : dimmed ? -0.22 : 0
    const rx = open ? 0 : hovered ? 0.18 : 0
    const ry = open ? -Math.PI / 2 + 0.25 : 0
    const rz = hovered && !open ? Math.sin(s.clock.elapsedTime * 2.4) * 0.015 : 0
    const k = placed ? 7 : 100
    g.position.x = THREE.MathUtils.damp(g.position.x, tx, k, dt)
    g.position.y = THREE.MathUtils.damp(g.position.y, ty, 8, dt)
    g.position.z = THREE.MathUtils.damp(g.position.z, tz, open ? 5 : 9, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, rx, 9, dt)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ry, 5, dt)
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, rz, 9, dt)
    tint.current.copy(white).lerp(dark, dimmed ? 1 : 0)
    clothTint.current.copy(clothColor).multiply(tint.current)
    const a = 1 - Math.exp(-6 * dt)
    mats.forEach((m) => m.color.lerp(m === mats[1] ? clothTint.current : tint.current, a))
  })

  return (
    <group
      ref={group}
      position={[baseX - width - 2, y, 0]}
      onPointerOver={(e) => { e.stopPropagation(); onHover(p.title); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); onOpen(p) }}
    >
      {/* Pivot on the bottom edge so a hovered book tips forward. */}
      <mesh position={[0, h / 2, 0]} material={mats} castShadow receiveShadow>
        <boxGeometry args={[t, h, DEPTH]} />
      </mesh>
    </group>
  )
}

function Plant({ x, y }) {
  const leaves = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2
    return { a, tilt: 0.5 + (i % 3) * 0.18, len: 0.42 + (i % 2) * 0.12 }
  }), [])
  return (
    <group position={[x, y, 0.05]}>
      <mesh position={[0, 0.19, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.38, 24]} />
        <meshStandardMaterial color="#d97a54" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.02, 24]} />
        <meshStandardMaterial color="#4a3426" roughness={1} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, 0.37, 0]} rotation={[0, l.a, l.tilt]}>
          <mesh position={[0, l.len / 2, 0]} castShadow>
            <capsuleGeometry args={[0.045, l.len, 4, 8]} />
            <meshStandardMaterial color={i % 2 ? '#4f8a4b' : '#3f7a3f'} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Shelf({ width, rows }) {
  const h = rows * ROW_H + PLANK
  const W = width + 0.3
  return (
    <group>
      <mesh position={[0, h / 2, -DEPTH / 2 - 0.06]} receiveShadow>
        <boxGeometry args={[W + SIDE * 2, h + PLANK, 0.04]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (W + SIDE)) / 2, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[SIDE, h + PLANK, DEPTH + 0.16]} />
          <meshStandardMaterial color={WOOD} roughness={0.75} />
        </mesh>
      ))}
      {Array.from({ length: rows + 1 }, (_, r) => (
        <mesh key={r} position={[0, r * ROW_H, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, PLANK, DEPTH + 0.16]} />
          <meshStandardMaterial color={WOOD} roughness={0.75} />
        </mesh>
      ))}
    </group>
  )
}

// Fits the camera so the whole shelf fills the canvas vertically.
function CameraRig({ h }) {
  const { camera } = useThree()
  useEffect(() => {
    const dist = (h / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.08
    camera.position.set(0, h / 2 + 0.3, dist)
    camera.lookAt(0, h / 2, 0)
    camera.updateProjectionMatrix()
  }, [camera, h])
  return null
}

function BookViewer({ project }) {
  const s = bookSize(project.title)
  const mats = useBookMaterials(project, s.t, s.h, s.band)
  return (
    <div className="model-viewer book-viewer">
      <Canvas camera={{ position: [1.6, 0.4, 1.6], fov: 35 }} dpr={[1, 2]}>
        <hemisphereLight args={['#ffffff', '#555', 1.1]} />
        <directionalLight position={[2, 3, 3]} intensity={2.2} />
        <mesh material={mats} rotation={[0, -0.4, 0]}>
          <boxGeometry args={[s.t, s.h, DEPTH]} />
        </mesh>
        <ContactShadows position={[0, -s.h / 2 - 0.02, 0]} opacity={0.4} scale={3} blur={2.5} />
        <OrbitControls autoRotate autoRotateSpeed={1.2} enablePan={false} minDistance={1.2} maxDistance={4} />
      </Canvas>
      <div className="viewer-hint">Drag to turn the book</div>
    </div>
  )
}

function projectLinks(p) {
  const links = [...(p.links || [])]
  if (p.repo) links.push({ label: 'Source on GitHub', url: `${profile.github}/${p.repo}` })
  return links
}

function BookDetail({ project, onClose }) {
  const tabs = ['Book', project.image && 'Screenshot', project.model && '3D model'].filter(Boolean)
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
        initial={{ y: 40, opacity: 0, rotateX: 8 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="np-head">
          <span className="np-badge"><span className="np-swatch" style={{ background: project.color }} /> Off the shelf</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="np-media">
          {tab === 'Book' && <BookViewer project={project} />}
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
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn primary">↗ {l.label}</a>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function BookShelf() {
  const width = useShelfWidth()
  const rows = useMemo(() => pack(width), [width])
  const shelfH = rows.length * ROW_H + PLANK
  const aspect = (width + 0.3 + SIDE * 2 + 0.5) / (shelfH + 0.5)
  const [filter, setFilter] = useState('All')
  const [hovered, setHovered] = useState(null)
  const [pulled, setPulled] = useState(null) // book out of the shelf
  const [open, setOpen] = useState(null) // details showing
  const wrap = useRef()
  const inView = useInView(wrap, { margin: '100px' })
  const seen = useInView(wrap, { once: true, amount: 0.3 })
  const matches = (p) => filter === 'All' || p.category === filter || (filter === '3D' && p.model)
  const count = useMemo(() => projects.filter(matches).length, [filter])

  // Pull the book out first, then open its details once it has turned.
  const pull = (p) => {
    setPulled(p)
    setTimeout(() => setOpen(p), 650)
  }
  const close = () => { setOpen(null); setTimeout(() => setPulled(null), 150) }

  let index = 0
  return (
    <div className="book-shop">
      <div className="filters" role="tablist" aria-label="Filter projects">
        {categories.map((c) => (
          <button key={c} role="tab" aria-selected={filter === c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>
            {filter === c && <motion.span layoutId="filter-pill" className="filter-pill" />}
            <span className="filter-label">{c}</span>
          </button>
        ))}
      </div>
      <div className="shop-grid">
        <div className="shelf-frame" ref={wrap} style={{ aspectRatio: aspect }}>
          <Canvas shadows dpr={[1, 2]} camera={{ fov: 24 }} frameloop={inView ? 'always' : 'never'} onPointerMissed={() => setHovered(null)}>
            <CameraRig h={shelfH} />
            <hemisphereLight args={['#fff6e8', '#8a7060', 1.3]} />
            <directionalLight position={[0, 1.5, 8]} intensity={0.9} />
            <directionalLight position={[-3, 6, 6]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={5} shadow-camera-bottom={-1} shadow-bias={-0.0005} />
            <Shelf width={width} rows={rows.length} />
            <Plant x={width / 2 - 0.3} y={(rows.length - 1) * ROW_H + PLANK / 2} />
            <Suspense fallback={null}>
              {rows.map((row, r) => row.map((b) => (
                <Book
                  key={b.project.title}
                  book={b}
                  width={width}
                  index={index++}
                  // Rows fill from the top shelf down.
                  y={(rows.length - 1 - r) * ROW_H + PLANK / 2}
                  shown={seen}
                  state={{ hovered: hovered === b.project.title, open: pulled?.title === b.project.title, dimmed: !matches(b.project) }}
                  onHover={setHovered}
                  onOpen={pull}
                />
              )))}
            </Suspense>
          </Canvas>
          <div className="shelf-sign">{count} of {projects.length} books</div>
        </div>
        <ol className="tracklist" aria-label="Project list">
          {projects.map((p, i) => (
            <li key={p.title} className={`${matches(p) ? '' : 'out'} ${hovered === p.title ? 'hot' : ''}`}>
              <button
                onMouseEnter={() => setHovered(p.title)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(p.title)}
                onBlur={() => setHovered(null)}
                onClick={() => pull(p)}
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
        {open && <BookDetail project={open} onClose={close} />}
      </AnimatePresence>
    </div>
  )
}

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { motion, useInView } from 'framer-motion'
import * as THREE from 'three'
import { Purin } from './models'
import { profile } from '../data/content'

// Floating pixel cubes drifting around the mascot.
function Cubes({ count = 40 }) {
  const ref = useRef()
  const cubes = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      p: new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5 - 1.5),
      s: 0.05 + Math.random() * 0.12,
      speed: 0.2 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      color: ['#7fc4ff', '#f6d36b', '#f29aa5', '#ffffff'][i % 4],
    })),
    [count],
  )
  const o = useMemo(() => new THREE.Object3D(), [])
  const c = useMemo(() => new THREE.Color(), [])

  useLayoutEffect(() => {
    cubes.forEach((cube, i) => ref.current.setColorAt(i, c.set(cube.color)))
    ref.current.instanceColor.needsUpdate = true
  }, [cubes, c])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    cubes.forEach((cube, i) => {
      o.position.set(cube.p.x, cube.p.y + Math.sin(t * cube.speed + cube.phase) * 0.3, cube.p.z)
      o.rotation.set(t * cube.speed, t * cube.speed * 0.7, 0)
      o.scale.setScalar(cube.s)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <boxGeometry />
      <meshStandardMaterial emissive="#335" roughness={0.4} />
    </instancedMesh>
  )
}

// Tilts the scene toward the pointer for a subtle parallax.
function Rig({ children }) {
  const ref = useRef()
  useFrame((state, dt) => {
    const { x, y } = state.pointer
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, x * 0.5, 3, dt)
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, -y * 0.2, 3, dt)
  })
  return <group ref={ref}>{children}</group>
}

// Keeps the mascot in the upper part of the screen, above the title, and
// shrinks it on narrow (portrait) screens.
function Stage({ children }) {
  const { width, height } = useThree((s) => s.viewport)
  const scale = Math.min(1.1, width / 2.6)
  return <group position={[0, height * 0.16, 0]} scale={scale}>{children}</group>
}

function Spinner({ children }) {
  const ref = useRef()
  useFrame((_, dt) => { ref.current.rotation.y += dt * 0.4 })
  return <group ref={ref}>{children}</group>
}

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

  return <span className="typed">{text}<span className="caret">|</span></span>
}

export default function Hero({ start }) {
  const words = profile.name.split(' ')
  const section = useRef()
  const inView = useInView(section)

  return (
    <section id="home" className="hero" ref={section}>
      <div className="hero-canvas">
        {/* Paused behind the loading screen (so the loader animates smoothly) and when scrolled away. */}
        <Canvas camera={{ position: [0, 0.4, 5], fov: 45 }} dpr={[1, 2]} frameloop={start && inView ? 'always' : 'never'}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 3]} intensity={2.4} />
          <pointLight position={[-3, -1, 2]} intensity={8} color="#7fc4ff" />
          <Rig>
            <Float speed={2} rotationIntensity={0.3} floatIntensity={0.8}>
              <Stage>
                <Spinner>{start && <Purin grow />}</Spinner>
              </Stage>
            </Float>
            <Cubes />
          </Rig>
        </Canvas>
      </div>

      <div className="hero-overlay">
        <motion.p
          className="hero-kicker"
          initial={{ opacity: 0, y: 10 }}
          animate={start ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          Player 1 · {profile.handle}
        </motion.p>
        <h1 className="hero-name" aria-label={profile.name}>
          {words.map((word, w) => (
            <span key={w} className="hero-word" aria-hidden="true">
              {word.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 40, rotate: -10 }}
                  animate={start ? { opacity: 1, y: 0, rotate: 0 } : {}}
                  transition={{ delay: 0.35 + (w * 5 + i) * 0.05, type: 'spring', stiffness: 300, damping: 18 }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          ))}
        </h1>
        <motion.p
          className="hero-role"
          initial={{ opacity: 0 }}
          animate={start ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
        >
          <TypedRoles roles={profile.roles} start={start} />
        </motion.p>
        <motion.div
          className="hero-cta"
          initial={{ opacity: 0, y: 20 }}
          animate={start ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.4 }}
        >
          <a href="#projects" className="btn primary">View projects</a>
          <a href="#gallery" className="btn">3D gallery</a>
        </motion.div>
      </div>

      <motion.a
        href="#about"
        className="scroll-cue"
        aria-label="Scroll down"
        initial={{ opacity: 0 }}
        animate={start ? { opacity: 1, y: [0, 8, 0] } : {}}
        transition={{ opacity: { delay: 1.8 }, y: { repeat: Infinity, duration: 1.4 } }}
      >
        ▼
      </motion.a>
    </section>
  )
}

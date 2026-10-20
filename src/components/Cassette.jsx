import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Cassette dimensions in scene units (roughly a real tape's 10 x 6.3 x 1.2 cm).
export const TAPE = { w: 1, h: 0.64, d: 0.12 }

function shade(hex, amt) {
  return '#' + new THREE.Color(hex).offsetHSL(0, 0, amt).getHexString()
}

// Draws the paper label. The canvas maps onto the label plane, and the tape
// window covers canvas rows ~168-292 between x ~214-810, so text stays in the
// top band, the bottom strip and either side of the window.
function drawLabel(project) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 384
  const g = c.getContext('2d')
  g.fillStyle = '#f4f1e8'
  g.fillRect(0, 0, c.width, c.height)
  // Top colour band with slanted stripes and the category.
  g.fillStyle = project.color
  g.fillRect(0, 0, c.width, 56)
  g.fillStyle = 'rgba(0,0,0,0.2)'
  for (let x = -80; x < c.width; x += 44) {
    g.beginPath(); g.moveTo(x, 56); g.lineTo(x + 22, 56); g.lineTo(x + 78, 0); g.lineTo(x + 56, 0); g.fill()
  }
  g.fillStyle = '#111'
  g.fillRect(0, 56, c.width, 5)
  g.fillStyle = '#fff'
  g.font = '38px Anton, Impact, sans-serif'
  g.textBaseline = 'middle'
  g.fillText(project.category.toUpperCase(), 28, 30)
  // Title, shrunk to fit.
  g.fillStyle = '#111'
  const title = project.title.toUpperCase()
  let size = 92
  do { g.font = `italic ${size}px Anton, Impact, sans-serif`; size -= 4 } while (g.measureText(title).width > c.width - 56 && size > 36)
  g.fillText(title, 28, 118)
  // Side marker left of the window, runtime right of it.
  g.fillStyle = '#d7ff1f'
  g.beginPath(); g.arc(100, 230, 46, 0, Math.PI * 2); g.fill()
  g.strokeStyle = '#111'; g.lineWidth = 5; g.stroke()
  g.fillStyle = '#111'
  g.textAlign = 'center'
  g.font = '60px Anton, Impact, sans-serif'
  g.fillText('A', 100, 233)
  g.font = '34px Anton, Impact, sans-serif'
  g.fillText('90', 920, 214)
  g.font = '24px Inter, sans-serif'
  g.fillText('MIN', 920, 250)
  g.textAlign = 'left'
  // Bottom strip: status or tags.
  g.fillStyle = '#111'
  g.fillRect(0, 312, c.width, 4)
  g.fillStyle = '#444'
  g.font = '30px Inter, sans-serif'
  g.fillText((project.status || project.tags.join(' · ')).toUpperCase(), 28, 350)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

// Rebuild label textures once the display font has loaded so the canvas
// doesn't bake in the fallback font.
function useLabel(project) {
  const [fontReady, setFontReady] = useState(false)
  useEffect(() => {
    let alive = true
    Promise.all([document.fonts.load('112px Anton'), document.fonts.load('34px Inter')])
      .finally(() => alive && setFontReady(true))
    return () => { alive = false }
  }, [])
  const tex = useMemo(() => drawLabel(project), [project, fontReady])
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

function Reel({ x, spin }) {
  const ref = useRef()
  useFrame((_, dt) => { if (spin.current) ref.current.rotation.z -= dt * 6 })
  return (
    <group position={[x, 0, 0]} ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.02, 24]} />
        <meshStandardMaterial color="#3a2a1e" roughness={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]}>
        <cylinderGeometry args={[0.045, 0.045, 0.01, 6]} />
        <meshStandardMaterial color="#f4f1e8" />
      </mesh>
    </group>
  )
}

// The built-in cassette, coloured per project with a generated label.
function ProceduralCassette({ project, spin }) {
  const label = useLabel(project)
  const shell = project.color
  const { w, h, d } = TAPE
  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={0.03} smoothness={3} castShadow>
        <meshStandardMaterial color={shell} roughness={0.45} />
      </RoundedBox>
      {/* Paper label */}
      <mesh position={[0, 0.06, d / 2 + 0.001]}>
        <planeGeometry args={[w * 0.86, h * 0.62]} />
        <meshStandardMaterial map={label} roughness={0.9} />
      </mesh>
      {/* Tape window with reels */}
      <mesh position={[0, 0.02, d / 2 + 0.003]}>
        <planeGeometry args={[w * 0.5, h * 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.2} transparent opacity={0.9} />
      </mesh>
      <group position={[0, 0.02, d / 2 + 0.004]}>
        <Reel x={-0.15} spin={spin} />
        <Reel x={0.15} spin={spin} />
      </group>
      {/* Bottom head guard */}
      <mesh position={[0, -h / 2 + 0.07, d / 2 + 0.01]}>
        <boxGeometry args={[w * 0.6, 0.11, 0.02]} />
        <meshStandardMaterial color={shade(shell, -0.12)} roughness={0.5} />
      </mesh>
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, -h / 2 + 0.07, d / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 12]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </group>
  )
}

// A cassette .glb made in Blender. Any material named "Label" gets the
// project's generated label, so one model can serve every project.
function GLBCassette({ url, project }) {
  const { scene } = useGLTF(url)
  const label = useLabel(project)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    clone.scale.setScalar(TAPE.w / Math.max(size.x, 0.001))
    const centre = box.getCenter(new THREE.Vector3()).multiplyScalar(clone.scale.x)
    clone.position.sub(centre)
    clone.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true
      o.material = o.material.clone()
      if (o.material.name === 'Label') { o.material.map = label; o.material.needsUpdate = true }
    })
    return clone
  }, [scene, label])
  return <primitive object={model} />
}

export default function Cassette({ project, tapeModel, spin }) {
  const fallbackSpin = useRef(false)
  const s = spin || fallbackSpin
  const url = project.cassette || tapeModel
  return url ? <GLBCassette url={url} project={project} /> : <ProceduralCassette project={project} spin={s} />
}

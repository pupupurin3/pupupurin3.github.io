import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Center, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Small deterministic RNG so procedural models look the same on every visit.
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const tmp = new THREE.Object3D()
const tmpColor = new THREE.Color()

// Renders a list of { position, color, scale? } as one instanced mesh.
function Voxels({ voxels, size = 1, wireframe, grow = false }) {
  const ref = useRef()
  const start = useRef(null)

  useLayoutEffect(() => {
    voxels.forEach((v, i) => {
      tmp.position.set(...v.position)
      const s = v.scale || [1, 1, 1]
      const g = grow ? 0.0001 : 1
      tmp.scale.set(s[0] * g, s[1] * g, s[2] * g)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
      ref.current.setColorAt(i, tmpColor.set(v.color))
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
    start.current = null
  }, [voxels, grow])

  // Optional build-up animation: voxels pop in from the bottom up.
  useFrame((state) => {
    if (!grow) return
    if (start.current === null) start.current = state.clock.elapsedTime
    const t = state.clock.elapsedTime - start.current
    if (t > 3) return
    voxels.forEach((v, i) => {
      const delay = v.order * 1.6
      const k = THREE.MathUtils.clamp((t - delay) / 0.35, 0, 1)
      const e = 1 - Math.pow(1 - k, 3)
      tmp.position.set(...v.position)
      const s = v.scale || [1, 1, 1]
      tmp.scale.set(s[0] * Math.max(e, 0.0001), s[1] * Math.max(e, 0.0001), s[2] * Math.max(e, 0.0001))
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[null, null, voxels.length]} castShadow receiveShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial roughness={0.55} wireframe={wireframe} />
    </instancedMesh>
  )
}

// "Purin" means pudding in Japanese: a voxel custard pudding mascot.
export function Purin({ wireframe, grow }) {
  const voxels = useMemo(() => {
    const out = []
    const H = 7
    for (let y = 0; y < H; y++) {
      const r = 4.6 - y * 0.38
      for (let x = -5; x <= 5; x++) {
        for (let z = -5; z <= 5; z++) {
          const d = Math.sqrt(x * x + z * z)
          if (d > r) continue
          const top = y === H - 1 || y >= H - 2 && d > r - 1
          const color = top ? (y === H - 1 ? '#7a3e12' : '#9c561d') : y % 2 ? '#f6d36b' : '#f2c95a'
          out.push({ position: [x, y + 1, z], color, order: y / H })
        }
      }
    }
    // Eyes and cheeks on the front face.
    const face = [
      [-1.5, 3, '#2a1d14'], [1.5, 3, '#2a1d14'],
      [-2.6, 2.2, '#f29aa5'], [2.6, 2.2, '#f29aa5'],
    ]
    face.forEach(([x, y, color]) => {
      const r = 4.6 - (y - 1) * 0.38
      const z = Math.floor(Math.sqrt(Math.max(r * r - x * x, 0))) + 0.55
      out.push({ position: [x, y, z], color, scale: [1, 1, 0.2], order: 0.9 })
    })
    // Plate.
    for (let x = -7; x <= 7; x++) {
      for (let z = -7; z <= 7; z++) {
        if (x * x + z * z <= 49) out.push({ position: [x, 0, z], color: (x + z) % 2 ? '#e8f1fb' : '#d6e4f3', scale: [1, 0.5, 1], order: 0 })
      }
    }
    return out
  }, [])

  return (
    <group scale={0.16} position={[0, -0.55, 0]}>
      <Voxels voxels={voxels} wireframe={wireframe} grow={grow} />
    </group>
  )
}

// Low-poly Mars terrain with a few scattered rocks.
export function Mars({ wireframe }) {
  const { geometry, rocks } = useMemo(() => {
    const rand = rng(7)
    const g = new THREE.PlaneGeometry(4, 4, 36, 36)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    const colors = []
    const low = new THREE.Color('#7a2e17')
    const high = new THREE.Color('#e08a52')
    const bumps = Array.from({ length: 6 }, () => [rand() * 4 - 2, rand() * 4 - 2, 0.2 + rand() * 0.5, rand() > 0.5 ? 1 : -1])
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      let h = Math.sin(x * 1.7) * 0.08 + Math.cos(z * 2.3) * 0.06 + (rand() - 0.5) * 0.05
      bumps.forEach(([bx, bz, r, sign]) => {
        const d = Math.hypot(x - bx, z - bz)
        // Craters dip in the middle with a raised rim; hills just rise.
        h += sign > 0 ? Math.exp(-(d * d) / (r * r)) * 0.45 : (d < r ? -0.25 * (1 - d / r) : 0) + Math.exp(-((d - r) ** 2) / 0.01) * 0.08
      })
      const falloff = Math.max(0, 1 - Math.hypot(x, z) / 2.9)
      h *= falloff
      pos.setY(i, h)
      colors.push(...low.clone().lerp(high, THREE.MathUtils.clamp(h * 2 + 0.45, 0, 1)).toArray())
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    g.computeVertexNormals()
    const rocks = Array.from({ length: 14 }, () => ({
      p: [rand() * 3 - 1.5, 0.05, rand() * 3 - 1.5],
      s: 0.04 + rand() * 0.08,
      r: [rand() * 3, rand() * 3, rand() * 3],
    }))
    return { geometry: g, rocks }
  }, [])

  return (
    <group position={[0, -0.3, 0]} scale={0.8}>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.9} wireframe={wireframe} />
      </mesh>
      {rocks.map((r, i) => (
        <mesh key={i} position={r.p} rotation={r.r} scale={r.s} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#5a2412" flatShading wireframe={wireframe} />
        </mesh>
      ))}
    </group>
  )
}

// A maze generated with a recursive backtracker; walls rise in when shown.
export function Maze({ wireframe, size = 9 }) {
  const voxels = useMemo(() => {
    const rand = rng(42)
    const n = size * 2 + 1
    const grid = Array.from({ length: n }, () => Array(n).fill(1))
    const stack = [[1, 1]]
    grid[1][1] = 0
    while (stack.length) {
      const [cx, cy] = stack[stack.length - 1]
      const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]]
        .map((d) => [cx + d[0], cy + d[1], d])
        .filter(([x, y]) => x > 0 && y > 0 && x < n - 1 && y < n - 1 && grid[y][x])
      if (!dirs.length) { stack.pop(); continue }
      const [nx, ny, d] = dirs[Math.floor(rand() * dirs.length)]
      grid[cy + d[1] / 2][cx + d[0] / 2] = 0
      grid[ny][nx] = 0
      stack.push([nx, ny])
    }
    grid[1][0] = 0
    grid[n - 2][n - 1] = 0
    const out = []
    const half = (n - 1) / 2
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const dist = Math.hypot(x - half, y - half) / (half * 1.5)
        if (grid[y][x]) out.push({ position: [x - half, 0.5, y - half], color: (x + y) % 2 ? '#3fae8c' : '#35997a', order: dist })
        out.push({ position: [x - half, -0.1, y - half], color: (x + y) % 2 ? '#1d2b3a' : '#223447', scale: [1, 0.2, 1], order: 0 })
      }
    }
    out.push({ position: [1 - half, 0.3, 1 - half], color: '#ffd166', scale: [0.5, 0.5, 0.5], order: 1 })
    return out
  }, [size])

  return (
    <group scale={0.17} rotation={[0, Math.PI / 4, 0]}>
      <Voxels voxels={voxels} wireframe={wireframe} grow />
    </group>
  )
}

// A user-supplied .glb, centred and normalised to roughly the same size.
function GLBModel({ url, wireframe }) {
  const { scene } = useGLTF(url)
  const fitted = useMemo(() => {
    const clone = scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const s = 2 / Math.max(...box.getSize(new THREE.Vector3()).toArray(), 0.001)
    clone.scale.setScalar(s)
    clone.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
    return clone
  }, [scene])

  useLayoutEffect(() => {
    fitted.traverse((o) => {
      if (o.isMesh) [].concat(o.material).forEach((m) => { m.wireframe = wireframe })
    })
  }, [fitted, wireframe])

  return <Center><primitive object={fitted} /></Center>
}

const builtIn = { purin: Purin, mars: Mars, maze: Maze }

export function Model({ model, wireframe }) {
  const Comp = builtIn[model]
  if (Comp) return <Comp wireframe={wireframe} grow={model === 'purin'} />
  return <GLBModel url={model} wireframe={wireframe} />
}

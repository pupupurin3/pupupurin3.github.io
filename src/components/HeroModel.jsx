import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei'
import { useInView, useReducedMotion } from 'framer-motion'
import * as THREE from 'three'

// The header diorama as a live model: it turns slowly on its own and can be
// dragged around. Zoom is off so scrolling over it still scrolls the page,
// and on touch screens vertical swipes pass through to the page as well.
// The flat render stays underneath as a poster until the model has loaded.

const HEIGHT = 2.2

// If the model can't be fetched or parsed, render nothing and leave the
// poster showing. Without this a loader error would unmount the whole app.
class ModelBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err) {
    console.warn('Header model failed to load:', err?.message || err)
    this.props.onError?.()
  }
  render() { return this.state.failed ? null : this.props.children }
}

function Diorama({ url, onReady }) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = HEIGHT / size.y
    clone.scale.setScalar(s)
    // Stand it on y = 0, centred on the origin.
    clone.position.set(-center.x * s, -box.min.y * s, -center.z * s)
    clone.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true
      o.receiveShadow = true
      o.material = new THREE.MeshStandardMaterial({ color: '#b4c2c5', roughness: 0.85 })
    })
    return clone
  }, [scene])

  useEffect(() => { onReady?.() }, [onReady])
  return <primitive object={model} />
}

export default function HeroModel({ url, poster, alt }) {
  const wrap = useRef()
  const controls = useRef()
  const inView = useInView(wrap, { margin: '100px' })
  const reduced = useReducedMotion()
  const [ready, setReady] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <div ref={wrap} className={`hero-stage ${ready ? 'ready' : ''}`}>
      <img className="hero-poster" src={poster} alt={alt} />
      <Canvas
        className="hero-canvas"
        shadows
        dpr={[1, 2]}
        camera={{ position: [3.2, 2.0, 4.6], fov: 30 }}
        frameloop={inView ? 'always' : 'never'}
        gl={{ alpha: true, antialias: true }}
        onPointerDown={() => setInteracted(true)}
      >
        <hemisphereLight args={['#ffffff', '#3a4146', 1.4]} />
        <directionalLight
          position={[-2.5, 6, 4]}
          intensity={2.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={3}
          shadow-camera-bottom={-3}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[4, 2, -3]} intensity={0.5} color="#8ab4ff" />
        <ModelBoundary onError={() => setFailed(true)}>
          <Suspense fallback={null}>
            <Diorama url={url} onReady={() => setReady(true)} />
          </Suspense>
        </ModelBoundary>
        <ContactShadows position={[0, 0.001, 0]} opacity={0.55} scale={5} blur={2.2} far={1.5} />
        <OrbitControls
          ref={controls}
          target={[0, HEIGHT * 0.45, 0]}
          enableZoom={false}
          enablePan={false}
          enableDamping
          autoRotate={!reduced}
          autoRotateSpeed={0.8}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.49}
        />
      </Canvas>
      <div className={`hero-stage-hint ${interacted || failed ? 'hide' : ''}`} aria-hidden="true">Drag to rotate</div>
    </div>
  )
}

useGLTF.preload?.(import.meta.env.BASE_URL + 'models/street-corner.glb')

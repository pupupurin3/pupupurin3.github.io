import { Component, Suspense, useRef, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { useInView } from 'framer-motion'
import { ContactShadows, Html, OrbitControls, useProgress } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Model } from './models'

function ViewerLoader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="viewer-loader">
        <div className="pixel-spinner" />
        <span>{Math.round(progress)}%</span>
      </div>
    </Html>
  )
}

// A model that fails to load shows a note instead of taking the page down.
class ModelBoundary extends Component<{ model: string; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  override componentDidUpdate(prev: { model: string }) {
    if (prev.model !== this.props.model && this.state.failed) this.setState({ failed: false })
  }
  override render() {
    if (!this.state.failed) return this.props.children
    return (
      <Html center>
        <div className="viewer-loader">
          <span>Couldn&apos;t load this model</span>
        </div>
      </Html>
    )
  }
}

/** Drag to orbit, scroll or pinch to zoom, with a few showcase toggles. */
export function ModelViewer({ model, className = '' }: { model: string; className?: string }) {
  const controls = useRef<OrbitControlsImpl>(null)
  const wrap = useRef<HTMLDivElement>(null)
  // Only render while on screen, so off-screen viewers don't burn GPU/battery.
  const inView = useInView(wrap, { margin: '100px' })
  const [autoRotate, setAutoRotate] = useState(true)
  const [wireframe, setWireframe] = useState(false)

  return (
    <div ref={wrap} className={`model-viewer ${className}`}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [2.4, 1.8, 2.6], fov: 40 }} frameloop={inView ? 'always' : 'never'}>
        <hemisphereLight args={['#cfe6ff', '#1b2333', 0.9]} />
        <directionalLight position={[3, 5, 2]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 2, -2]} intensity={0.6} color="#7fb8ff" />
        <ModelBoundary model={model}>
          <Suspense fallback={<ViewerLoader />}>
            <Model key={model} model={model} wireframe={wireframe} />
          </Suspense>
        </ModelBoundary>
        <ContactShadows position={[0, -0.62, 0]} opacity={0.5} scale={6} blur={2.4} far={2} />
        <OrbitControls
          ref={controls}
          makeDefault
          autoRotate={autoRotate}
          autoRotateSpeed={1.2}
          enableDamping
          enablePan={false}
          minDistance={1.6}
          maxDistance={7}
        />
      </Canvas>
      <div className="viewer-toolbar">
        <button className={autoRotate ? 'on' : ''} onClick={() => setAutoRotate((v) => !v)}>
          Spin
        </button>
        <button className={wireframe ? 'on' : ''} onClick={() => setWireframe((v) => !v)}>
          Wireframe
        </button>
        <button onClick={() => controls.current?.reset()}>Reset</button>
      </div>
      <div className="viewer-hint">Drag to rotate · Scroll to zoom</div>
    </div>
  )
}

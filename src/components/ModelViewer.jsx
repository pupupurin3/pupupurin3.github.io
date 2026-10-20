import { Suspense, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useInView } from 'framer-motion'
import { ContactShadows, Html, OrbitControls, useProgress } from '@react-three/drei'
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

// Drag to orbit, scroll or pinch to zoom, with a few showcase toggles.
export default function ModelViewer({ model, className = '' }) {
  const controls = useRef()
  const wrap = useRef()
  // Only render while on screen, so off-screen viewers don't burn GPU/battery.
  const inView = useInView(wrap, { margin: '100px' })
  const [autoRotate, setAutoRotate] = useState(true)
  const [wireframe, setWireframe] = useState(false)

  return (
    <div ref={wrap} className={`model-viewer ${className}`}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [2.4, 1.8, 2.6], fov: 40 }} frameloop={inView ? 'always' : 'never'}>
        <color attach="background" args={['#111214']} />
        <hemisphereLight args={['#cfe6ff', '#1b2333', 0.9]} />
        <directionalLight position={[3, 5, 2]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 2, -2]} intensity={0.6} color="#7fb8ff" />
        <Suspense fallback={<ViewerLoader />}>
          <Model key={model} model={model} wireframe={wireframe} />
        </Suspense>
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
        <button className={autoRotate ? 'on' : ''} onClick={() => setAutoRotate((v) => !v)}>Spin</button>
        <button className={wireframe ? 'on' : ''} onClick={() => setWireframe((v) => !v)}>Wireframe</button>
        <button onClick={() => controls.current?.reset()}>Reset</button>
      </div>
      <div className="viewer-hint">Drag to rotate · Scroll to zoom</div>
    </div>
  )
}

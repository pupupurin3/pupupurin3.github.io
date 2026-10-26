import { lazy, Suspense, type ComponentProps } from 'react'

// Three.js and the viewer load on first use, so the page itself starts faster.
const Viewer = lazy(() => import('./ModelViewer').then((m) => ({ default: m.ModelViewer })))

export function ModelViewer(props: ComponentProps<typeof Viewer>) {
  return (
    <Suspense fallback={<div className={`model-viewer ${props.className ?? ''}`} aria-busy="true" />}>
      <Viewer {...props} />
    </Suspense>
  )
}

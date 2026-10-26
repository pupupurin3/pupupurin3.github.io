import { useState } from 'react'
import { gallery } from '../../content/gallery'
import { ModelViewer } from '../three/LazyModelViewer'

export function ModelGallery() {
  const [i, setI] = useState(0)
  return (
    <div className="gallery">
      <div className="gallery-list" role="tablist" aria-label="Models">
        {gallery.map((g, idx) => (
          <button key={g.name} role="tab" aria-selected={idx === i} className={idx === i ? 'on' : ''} onClick={() => setI(idx)}>
            <strong>{g.name}</strong>
            <small>{g.note}</small>
          </button>
        ))}
      </div>
      <ModelViewer model={gallery[i]!.model} className="gallery-viewer" />
    </div>
  )
}

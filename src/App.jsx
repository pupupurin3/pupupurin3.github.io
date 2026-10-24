import { useCallback, useRef, useState } from 'react'
import LoadingScreen from './components/LoadingScreen'
import Hero from './components/Hero'
import Work from './components/Work'
import Lab from './components/Lab'
import CommandPalette from './components/CommandPalette'
import PlayLayer from './components/PlayLayer'
import { About, Contact, Nav, ScrollProgress, SectionHeader, Toast } from './components/Sections'

export default function App() {
  const [started, setStarted] = useState(false)
  const [toast, setToast] = useState(null)
  const timer = useRef()
  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2000)
  }, [])

  return (
    <>
      <PencilFilter />
      <LoadingScreen onDone={() => setStarted(true)} />
      <ScrollProgress />
      <Nav show={started} />
      <main>
        <Hero start={started} />
        <section id="work" className="section">
          <SectionHeader index="01" title="Selected work" lede="Games, simulations and tools I’ve built. Open a project for details and source." />
          <Work />
        </section>
        <section id="lab" className="section">
          <SectionHeader index="02" title="Lab" lede="Interactive experiments in 3D, motion and gesture-driven UI, each built from scratch for this site." />
          <Lab />
        </section>
        <section id="about" className="section">
          <SectionHeader index="03" title="About" />
          <About />
        </section>
        <section id="contact" className="section">
          <Contact onToast={showToast} />
        </section>
      </main>
      <PlayLayer show={started} onToast={showToast} />
      <CommandPalette onToast={showToast} />
      <Toast message={toast} />
    </>
  )
}

// Hand-drawn outline: grows the element's silhouette, roughens it with noise
// and paints it in pencil ink underneath. Used via `filter: url(#pencil)`.
function PencilFilter() {
  return (
    <svg className="svg-defs" aria-hidden="true" focusable="false">
      <filter id="pencil" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="thick" />
        <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="thick" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" result="rough" />
        <feFlood className="pencil-ink" />
        <feComposite in2="rough" operator="in" result="outline" />
        <feMerge>
          <feMergeNode in="outline" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Text version: a paper-coloured gap first, then the pencil line, like a sticker. */}
      <filter id="pencil-text" x="-10%" y="-20%" width="120%" height="140%" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="gap" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="4.5" result="thick" />
        <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="3" result="noise" />
        <feDisplacementMap in="thick" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" result="rough" />
        <feFlood className="pencil-ink" />
        <feComposite in2="rough" operator="in" result="outline" />
        <feFlood className="pencil-paper" />
        <feComposite in2="gap" operator="in" result="paper" />
        <feMerge>
          <feMergeNode in="outline" />
          <feMergeNode in="paper" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </svg>
  )
}

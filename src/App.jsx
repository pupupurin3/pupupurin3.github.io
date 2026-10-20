import { useCallback, useRef, useState } from 'react'
import LoadingScreen from './components/LoadingScreen'
import Hero from './components/Hero'
import Work from './components/Work'
import Lab from './components/Lab'
import CommandPalette from './components/CommandPalette'
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
      <CommandPalette onToast={showToast} />
      <Toast message={toast} />
    </>
  )
}

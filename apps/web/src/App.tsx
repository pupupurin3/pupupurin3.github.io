import { useState } from 'react'
import { About } from './components/about/About'
import { Contact } from './components/contact/Contact'
import { PlayLayer } from './components/game/PlayLayer'
import { Hero } from './components/hero/Hero'
import { Lab } from './components/lab/Lab'
import { LoadingScreen } from './components/layout/LoadingScreen'
import { Nav } from './components/layout/Nav'
import { ScrollProgress } from './components/layout/ScrollProgress'
import { CommandPalette } from './components/palette/CommandPalette'
import { SectionHeader } from './components/ui/SectionHeader'
import { Toast } from './components/ui/Toast'
import { Work } from './components/work/Work'
import { ProjectStatsProvider } from './hooks/projectStats'
import { useToast } from './hooks/useToast'

export default function App() {
  const [started, setStarted] = useState(false)
  const [toast, showToast] = useToast()

  return (
    <ProjectStatsProvider>
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
    </ProjectStatsProvider>
  )
}

import { useState } from 'react'
import { About } from './components/about/About'
import { Contact } from './components/contact/Contact'
import { PlayLayer } from './components/game/PlayLayer'
import { Hero } from './components/hero/Hero'
import { Lab } from './components/lab/Lab'
import { LoadingScreen } from './components/layout/LoadingScreen'
import { Nav } from './components/layout/Nav'
import { Rail } from './components/layout/Rail'
import { ScrollProgress } from './components/layout/ScrollProgress'
import { CommandPalette } from './components/palette/CommandPalette'
import { SectionHeader } from './components/ui/SectionHeader'
import { Toast } from './components/ui/Toast'
import { Work } from './components/work/Work'
import { WorkIndex } from './components/work/WorkIndex'
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
      <Rail show={started} />
      <main>
        <Hero start={started} />
        <section id="work" className="section">
          <SectionHeader index="01" title="Work" lede="3D models, games and simulations. Open a project for details, source and live models." />
          <Work />
          <WorkIndex />
        </section>
        <section id="lab" className="section">
          <SectionHeader index="02" title="Lab" lede="The technical side: simulations and maths running live in your browser. Open an app, drag the windows around, and hit Σ Maths to see how each one works." />
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

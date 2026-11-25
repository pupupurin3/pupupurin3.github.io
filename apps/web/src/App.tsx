import { useState } from 'react'
import { About } from './components/about/About'
import { Contact } from './components/contact/Contact'
import { Hero } from './components/hero/Hero'
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
          <SectionHeader index="01" title="Work" lede="Projects, 3D models and simulations. Open one for details, source and live models." />
          <Work />
          <WorkIndex />
        </section>
        <section id="about" className="section">
          <SectionHeader index="02" title="About" />
          <About />
        </section>
        <section id="contact" className="section">
          <Contact onToast={showToast} />
        </section>
      </main>
      <CommandPalette onToast={showToast} />
      <Toast message={toast} />
    </ProjectStatsProvider>
  )
}

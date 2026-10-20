import { useState } from 'react'
import LoadingScreen from './components/LoadingScreen'
import Hero from './components/Hero'
import { About, Contact, Experience, Gallery, Nav, Projects, ScrollProgress } from './components/Sections'

export default function App() {
  const [started, setStarted] = useState(false)

  return (
    <>
      <LoadingScreen onDone={() => setStarted(true)} />
      <ScrollProgress />
      <Nav show={started} />
      <main>
        <Hero start={started} />
        <About />
        <Projects />
        <Gallery />
        <Experience />
        <Contact />
      </main>
    </>
  )
}

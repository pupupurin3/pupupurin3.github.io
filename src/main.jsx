import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App'
import '@fontsource/anton/latin-400.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-700.css'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Honour the visitor's reduced-motion setting across every animation. */}
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)

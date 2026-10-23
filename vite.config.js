import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// pupupurin3.github.io is a user site, so it is served from the domain root.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
  },
})

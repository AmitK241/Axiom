import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    // Exclude gsap and lenis from Vite's dep pre-bundling.
    // gsap ships with very large source maps that cause esbuild OOM
    // during the optimization pass. Both libs are already ESM-compatible
    // so they don't need pre-bundling.
    exclude: ['gsap', 'lenis'],
  },
})

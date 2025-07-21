import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist/dashboard'
  },
  server: {
    port: 5172,
    proxy: {
      '/api': 'http://localhost:7542'
    }
  }
})
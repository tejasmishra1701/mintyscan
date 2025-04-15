import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss' 
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    cssMinify: 'esbuild' // Use esbuild instead of lightningcss
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})



import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': '/src' } },
  build: { target: 'es2020', cssCodeSplit: true },
  // Geliştirmede /api istekleri yerel PHP sunucusuna gider (npm run api).
  server: { proxy: { '/api': 'http://127.0.0.1:8091' } },
  preview: { proxy: { '/api': 'http://127.0.0.1:8091' } },
})

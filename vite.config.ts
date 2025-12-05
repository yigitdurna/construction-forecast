import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use root '/' for Vercel, '/construction-forecast/' for GitHub Pages
  base: process.env.VERCEL ? '/' : '/construction-forecast/',
})

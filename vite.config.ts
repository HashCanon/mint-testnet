// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'docs',   // ⇒ vite build → ./docs
    emptyOutDir: true
  },
  base: '/hashjing-mint-testnet/'
})

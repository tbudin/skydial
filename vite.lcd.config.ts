import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()], root: 'examples/lcd', base: '/lcd-demo/',
  build: { outDir: '../../dist-lcd-consumer', emptyOutDir: true },
})

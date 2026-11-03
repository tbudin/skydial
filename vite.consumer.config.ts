import { compile } from 'svelte/compiler'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), {
    name: 'svelte-consumer-fixture',
    transform(source, id) {
      if (!id.endsWith('.svelte')) return
      const result = compile(source, { filename: id, generate: 'client', dev: false })
      return { code: result.js.code, map: result.js.map }
    },
  }],
  root: 'examples/consumer',
  base: '/package-demo/',
  build: { outDir: '../../dist-consumer', emptyOutDir: true, chunkSizeWarningLimit: 1600 },
})

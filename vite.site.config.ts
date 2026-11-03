import { defineConfig } from 'vite'
export default defineConfig({
  base: './',
  build: {
    outDir: 'site/runtime-dist', emptyOutDir: true, copyPublicDir: false, chunkSizeWarningLimit: 1600,
    rolldownOptions: { preserveEntrySignatures: 'strict', input: 'site/runtime.ts', output: { entryFileNames: 'runtime.js' } },
  },
})

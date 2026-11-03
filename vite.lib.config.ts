import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

// Library builds: `npm run build:lib`
// - dist-lib/astro.js: framework-free astronomy core (depends only on astronomy-engine)
// - dist-lib/react.js: <CelestialClock /> React component
export default defineConfig({
  base: './',
  plugins: [react(), {
    name: 'react-client-entry',
    generateBundle(_options, bundle) {
      this.emitFile({ type: 'asset', fileName: 'style.d.ts', source: 'export {}\n' })
      this.emitFile({ type: 'asset', fileName: 'picker.css', source: readFileSync(new URL('./src/lib/formPicker.css', import.meta.url), 'utf8') })
      for (const output of Object.values(bundle)) {
        if (output.type === 'chunk' && output.isEntry && ['react', 'pickers'].includes(output.name)) {
          output.code = '"use client";\n' + output.code
        }
      }
    },
  }],
  publicDir: false,
  build: {
    outDir: 'dist-lib',
    assetsInlineLimit: 0,
    emptyOutDir: true,
    lib: {
      entry: { pickers: 'src/lib/pickers.ts', astro: 'src/astro/index.ts', react: 'src/lib/build.ts', three: 'src/three/index.ts', clock: 'src/sim/index.ts', dom: 'src/dom/index.ts', vue: 'src/vue/index.ts', svelte: 'src/svelte/index.ts' },
      formats: ['es'],
      cssFileName: 'skydial',
    },
    rolldownOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^three($|\/)/, /^@react-three\//, /^vue($|\/)/, /^svelte($|\/)/, 'astronomy-engine'],
    },
  },
})

import { readdirSync, existsSync } from 'node:fs'
const styles = existsSync('site/runtime-dist/assets') ? readdirSync('site/runtime-dist/assets').filter((name) => name.endsWith('.css')).map((name) => `runtime/assets/${name}`) : []

export default {
  tagline: 'time, from the movement of worlds',
  baseUrl: 'https://tbudin.github.io/skydial/',
  repo: 'https://github.com/tbudin/skydial',
  npm: 'https://www.npmjs.com/package/skydial',
  out: 'site-dist',
  author: { name: 'Thomas Budin' },
  owner: 'Plain Matter Pte Ltd',
  editBranch: 'main',
  changelog: 'CHANGELOG.md',
  programmingLanguage: 'TypeScript',
  runtimePlatform: 'Browser / Node.js',
  codeLang: 'tsx',
  about: 'Interactive 3D astronomical date and time pickers, compact website widgets, and a framework-independent astronomy core. Real positions, rotation and illumination. React, Vue, Svelte and vanilla JavaScript integrations.',
  groups: ['Start', 'Components', 'Frameworks', 'Reference'],
  themeColor: { light: '#f6f3ec', dark: '#10141d' },
  theme: {
    tokens: { '--bg': '#f6f3ec', '--panel': '#ffffff', '--accent': '#386652', '--mark': '#dfe9dc', '--f-head': 'Georgia, serif', '--stage-bg': '#060b13' },
    dark: { '--bg': '#10141d', '--panel': '#171e2b', '--accent': '#91c8a5', '--mark': '#293e35', '--stage-bg': '#060b13' },
    extra: '.celestial-demo{width:100%;min-height:230px;display:flex;justify-content:center;align-items:center}.celestial-demo[data-demo="picker"]{display:block}.celestial-doc-placeholder{font-size:13px;color:#8e9ab0;max-width:320px;line-height:1.8;text-align:center}.framework-note{font-size:13px;line-height:1.8}.stage{overflow:visible}',
  },
  icon: '/skydial/favicon.svg',
  stylesheets: [...styles, 'gallery.css'],
  static: [['public/favicon.svg', 'favicon.svg'], ['site/runtime-dist', 'runtime'], ['site/gallery.css', 'gallery.css']],
  credit: {
    statement: '{title}, made by {creators}',
    materials: [
      { kind: 'library', name: 'Astronomy Engine', url: 'https://github.com/cosinekitty/astronomy', licence: 'MIT', use: 'Celestial positions and orientation' },
      { kind: 'texture', name: 'Solar System Scope', url: 'https://www.solarsystemscope.com/textures/', licence: 'CC BY 4.0', use: 'Solar, planetary and lunar surface maps' },
      { kind: 'texture', name: 'NASA Earth Observatory', url: 'https://earthobservatory.nasa.gov/', licence: 'Public domain', use: 'Earth at night' },
    ],
  },
}

import { TexturedOrrery } from './TexturedOrrery.js'
import { EarthGlobe } from './EarthGlobe.js'
import { MoonGlobe } from './MoonGlobe.js'
import { PlanetGlobe } from './PlanetGlobe.js'
import { CompactOrrery } from './CompactOrrery.js'
import { loadTextures } from './textures.js'
import { renderThumbnails } from './thumbnails.js'
import type { VisualRenderer } from './visualRenderer.js'


export const nativeRenderer: VisualRenderer = {
  Earth: EarthGlobe, Moon: MoonGlobe, Planet: PlanetGlobe, Orrery: TexturedOrrery, CompactOrrery,
  thumbnails: async () => renderThumbnails((await loadTextures()).textures, Date.now()),
}

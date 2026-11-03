/** Framework-independent Three.js models. No React or DOM required. */
export { createPlanetObject, createSunObject, createMoonObject, applyBodyAxes, applyAxesInWorld, DISPLAY_RADIUS, SUN_DISPLAY_RADIUS } from '../render/planetFactory.js'
export type { PlanetObject, RingShadowUniforms, CelestialBodyId, CelestialTextures } from '../render/planetFactory.js'
export type { TextureSet, TextureKey } from '../render/textures.js'
export { SimClock, SPEEDS } from '../sim/clock.js'
export type { ClockState, SpeedId } from '../sim/clock.js'
export { loadCelestialTextures, CELESTIAL_TEXTURE_URLS } from './assets.js'
export type { CelestialTextureOptions, CelestialTextureResult, CelestialTextureKey } from './assets.js'

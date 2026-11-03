import * as THREE from 'three'
import { TEXTURE_URLS, type TextureKey } from '../render/textures.js'
import type { CelestialBodyId, CelestialTextures } from '../render/planetFactory.js'

export type CelestialTextureKey = TextureKey | 'moon' | 'moonNormal'

export const CELESTIAL_TEXTURE_URLS: Record<CelestialTextureKey, string> = {
  ...TEXTURE_URLS,
  moon: new URL('../../public/textures/moon_2k.jpg?no-inline', import.meta.url).href,
  moonNormal: new URL('../../public/textures/moon_normal_1k.jpg?no-inline', import.meta.url).href,
}

export interface CelestialTextureOptions {
  bodies?: readonly CelestialBodyId[]
  /** Override individual URLs, for example to use your own CDN. */
  urls?: Partial<Record<CelestialTextureKey, string>>
}

export interface CelestialTextureResult {
  textures: CelestialTextures
  failed: CelestialTextureKey[]
  /** Call after disposing models that use this texture set. */
  dispose: () => void
}

/** Browser texture loader for non-React integrations. Call only on the client. */
export async function loadCelestialTextures(options: CelestialTextureOptions = {}): Promise<CelestialTextureResult> {
  const keys = new Set<CelestialTextureKey>(options.bodies ?? ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'moon'])
  if (keys.has('saturn')) keys.add('saturnRing')
  if (keys.has('moon')) keys.add('moonNormal')
  const loader = new THREE.TextureLoader()
  const textures: CelestialTextures = {}
  const failed: CelestialTextureKey[] = []
  await Promise.all([...keys].map(async (key) => {
    try {
      const texture = await loader.loadAsync(options.urls?.[key] ?? CELESTIAL_TEXTURE_URLS[key])
      texture.colorSpace = key === 'moonNormal' ? THREE.NoColorSpace : THREE.SRGBColorSpace
      texture.anisotropy = 4
      textures[key] = texture
    } catch {
      failed.push(key)
    }
  }))
  return { textures, failed, dispose: () => Object.values(textures).forEach((texture) => texture.dispose()) }
}

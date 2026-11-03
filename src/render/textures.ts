import * as THREE from 'three'

/**
 * Self-hosted texture loading with visible failure handling.
 * Textures live in /public/textures (see ATTRIBUTION.md there).
 */

export const TEXTURE_URLS = {
  sun: new URL('../../public/textures/sun_1k.jpg?no-inline', import.meta.url).href,
  mercury: new URL('../../public/textures/mercury_1k.jpg?no-inline', import.meta.url).href,
  venus: new URL('../../public/textures/venus_1k.jpg?no-inline', import.meta.url).href,
  earth: new URL('../../public/textures/earth_1k.jpg?no-inline', import.meta.url).href,
  mars: new URL('../../public/textures/mars_1k.jpg?no-inline', import.meta.url).href,
  jupiter: new URL('../../public/textures/jupiter_1k.jpg?no-inline', import.meta.url).href,
  saturn: new URL('../../public/textures/saturn_1k.jpg?no-inline', import.meta.url).href,
  uranus: new URL('../../public/textures/uranus_1k.jpg?no-inline', import.meta.url).href,
  neptune: new URL('../../public/textures/neptune_1k.jpg?no-inline', import.meta.url).href,
  saturnRing: new URL('../../public/textures/saturn_ring.png?no-inline', import.meta.url).href,
} as const

export type TextureKey = keyof typeof TEXTURE_URLS

import { FALLBACK_COLOURS } from './fallbackColours.js'
export { FALLBACK_COLOURS }

export type TextureSet = Partial<Record<TextureKey, THREE.Texture>>

export interface TextureLoadResult {
  textures: TextureSet
  failed: TextureKey[]
}

const loader = new THREE.TextureLoader()
let cache: Promise<TextureLoadResult> | null = null

export function loadTextures(): Promise<TextureLoadResult> {
  if (cache) return cache
  cache = (async () => {
    const textures: TextureSet = {}
    const failed: TextureKey[] = []
    await Promise.all(
      (Object.keys(TEXTURE_URLS) as TextureKey[]).map(
        (key) =>
          new Promise<void>((resolve) => {
            loader.load(
              TEXTURE_URLS[key],
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace
                tex.anisotropy = 4
                if (key === 'saturnRing') {
                  tex.wrapS = THREE.ClampToEdgeWrapping
                  tex.wrapT = THREE.ClampToEdgeWrapping
                }
                textures[key] = tex
                resolve()
              },
              undefined,
              () => {
                failed.push(key)
                console.error(`[celestial-clock] Texture failed to load: ${TEXTURE_URLS[key]}`)
                resolve()
              },
            )
          }),
      ),
    )
    return { textures, failed }
  })()
  return cache
}

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

/** Detailed illustration maps; the small orbital models keep their lighter maps. */
const ILLUSTRATION_TEXTURE_URLS = {
  mercury: new URL('../../public/textures/mercury_2k.jpg?no-inline', import.meta.url).href,
  venus: new URL('../../public/textures/venus_2k.jpg?no-inline', import.meta.url).href,
  mars: new URL('../../public/textures/mars_2k.jpg?no-inline', import.meta.url).href,
  jupiter: new URL('../../public/textures/jupiter_2k.jpg?no-inline', import.meta.url).href,
  saturn: new URL('../../public/textures/saturn_2k.jpg?no-inline', import.meta.url).href,
  uranus: new URL('../../public/textures/uranus_2k.jpg?no-inline', import.meta.url).href,
  neptune: new URL('../../public/textures/neptune_2k.jpg?no-inline', import.meta.url).href,
}

export type TextureKey = keyof typeof TEXTURE_URLS

import { FALLBACK_COLOURS } from './fallbackColours.js'
export { FALLBACK_COLOURS }

export type TextureSet = Partial<Record<TextureKey, THREE.Texture>>

export interface TextureLoadResult {
  textures: TextureSet
  failed: TextureKey[]
}

const loader = new THREE.TextureLoader()
const cache = new Map<string, Promise<THREE.Texture | null>>()

export async function loadTextures(keys: readonly TextureKey[] = Object.keys(TEXTURE_URLS) as TextureKey[], detail: 'compact' | 'detailed' = 'compact'): Promise<TextureLoadResult> {
  const textures: TextureSet = {}
  const failed: TextureKey[] = []
  await Promise.all(
    [...new Set(keys)].map(async (key) => {
      const url = detail === 'detailed' && key in ILLUSTRATION_TEXTURE_URLS ? ILLUSTRATION_TEXTURE_URLS[key as keyof typeof ILLUSTRATION_TEXTURE_URLS] : TEXTURE_URLS[key]
      let pending = cache.get(url)
      if (!pending) {
        pending = new Promise<THREE.Texture | null>((resolve) => {
          loader.load(
            url,
            (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace
              tex.anisotropy = detail === 'detailed' ? 8 : 4
              if (key === 'saturnRing') {
                tex.wrapS = THREE.ClampToEdgeWrapping
                tex.wrapT = THREE.ClampToEdgeWrapping
              }
              resolve(tex)
            },
            undefined,
            () => {
              console.error(`[celestial-clock] Texture failed to load: ${url}`)
              resolve(null)
            },
          )
        })
        cache.set(url, pending)
      }
      const texture = await pending
      if (texture) textures[key] = texture
      else failed.push(key)
    }),
  )
  return { textures, failed }
}

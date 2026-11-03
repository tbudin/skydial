import { useEffect, useState } from 'react'
import * as THREE from 'three'

/** Higher-resolution maps for the Earth and Moon panels, loaded on demand. */
export const PANEL_TEXTURES = {
  earthDay: { url: new URL('../../public/textures/earth_2k.jpg?no-inline', import.meta.url).href, srgb: true },
  earthNight: { url: new URL('../../public/textures/earth_night_2k.jpg?no-inline', import.meta.url).href, srgb: true },
  earthRough: { url: new URL('../../public/textures/earth_rough_2k.jpg?no-inline', import.meta.url).href, srgb: false },
  moon: { url: new URL('../../public/textures/moon_2k.jpg?no-inline', import.meta.url).href, srgb: true },
  moonNormal: { url: new URL('../../public/textures/moon_normal_1k.jpg?no-inline', import.meta.url).href, srgb: false },
} as const

export type PanelTextureKey = keyof typeof PANEL_TEXTURES

const loader = new THREE.TextureLoader()
const cache = new Map<PanelTextureKey, Promise<THREE.Texture | null>>()

function load(key: PanelTextureKey) {
  let p = cache.get(key)
  if (!p) {
    const spec = PANEL_TEXTURES[key]
    p = new Promise((resolve) => {
      loader.load(
        spec.url,
        (t) => {
          t.colorSpace = spec.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
          t.anisotropy = 8
          resolve(t)
        },
        undefined,
        () => {
          console.error(`[celestial-clock] Texture failed to load: ${spec.url}`)
          resolve(null)
        },
      )
    })
    cache.set(key, p)
  }
  return p
}

export interface PanelTextureState<K extends PanelTextureKey> {
  ready: boolean
  textures: Partial<Record<K, THREE.Texture>>
  failed: K[]
}

export function usePanelTextures<K extends PanelTextureKey>(keys: readonly K[]): PanelTextureState<K> {
  const [state, setState] = useState<PanelTextureState<K>>({ ready: false, textures: {}, failed: [] })
  const id = keys.join(',')
  useEffect(() => {
    let cancelled = false
    const list = id.split(',') as K[]
    Promise.all(list.map((k) => load(k))).then((res) => {
      if (cancelled) return
      const textures: Partial<Record<K, THREE.Texture>> = {}
      const failed: K[] = []
      res.forEach((t, i) => (t ? (textures[list[i]] = t) : failed.push(list[i])))
      setState({ ready: true, textures, failed })
    })
    return () => {
      cancelled = true
    }
  }, [id])
  return state
}

import * as THREE from 'three'
import { URANUS_RING_BANDS } from './artworkMotion.js'

/** Independent visual clock: updating a material never advances the simulation. */
export function animateRingMaterial(material: THREE.MeshStandardMaterial, radius: number, uranus: boolean) {
  const time = { value: 0 }
  const previous = material.onBeforeCompile
  material.onBeforeCompile = function (shader, renderer) {
    previous.call(this, shader, renderer)
    shader.uniforms.uArtworkSeconds = time
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vRingMaterial;')
      .replace('#include <project_vertex>', `#include <project_vertex>\nvRingMaterial = vec2(length(position.xz) / ${radius.toFixed(6)}, atan(position.z, position.x));`)
    const bands = URANUS_RING_BANDS.map((r) => `exp(-pow((vRingMaterial.x - ${r.toFixed(4)}) / ${r > 1.99 ? '.006' : '.0025'}, 2.0))`).join(' + ')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uArtworkSeconds; varying vec2 vRingMaterial;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        float phase = vRingMaterial.y - uArtworkSeconds * .28 / pow(max(1.0, vRingMaterial.x), 1.5);
        float drift = .84 + .10 * sin(phase * 31.0 + vRingMaterial.x * 271.0) + .06 * sin(phase * 73.0 - vRingMaterial.x * 911.0);
        diffuseColor.rgb *= drift;
        ${uranus ? `diffuseColor.a *= clamp(${bands}, 0.0, 1.0);` : ''}`)
  }
  material.customProgramCacheKey = () => `skydial-ring-motion-${uranus ? 'uranus' : 'saturn'}`
  return (seconds: number) => { time.value = Number.isFinite(seconds) ? seconds : 0 }
}

export function animateSolarMaterial(material: THREE.MeshBasicMaterial) {
  const time = { value: 0 }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uArtworkSeconds = time
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uArtworkSeconds;')
      .replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec2 solarUv = vMapUv + vec2(.004 * sin(vMapUv.y * 69.0 + uArtworkSeconds * .24), .003 * sin(vMapUv.x * 81.0 - uArtworkSeconds * .19));
          ${THREE.ShaderChunk.map_fragment.replaceAll('vMapUv', 'solarUv')}
          float cells = .88 + .12 * sin(solarUv.x * 358.0 + sin(solarUv.y * 233.0 + uArtworkSeconds * .21)) * sin(solarUv.y * 396.0 - uArtworkSeconds * .17);
          diffuseColor.rgb *= cells;
        #endif`)
  }
  material.customProgramCacheKey = () => 'skydial-solar-convection'
  return (seconds: number) => { time.value = Number.isFinite(seconds) ? seconds : 0 }
}

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createMoonObject, createSunObject, SUN_DISPLAY_RADIUS, type CelestialTextures, type PlanetObject } from './planetFactory.js'
import { loadTextures, type TextureSet } from './textures.js'
import { usePanelTextures } from './panelTextures.js'
import { useRenderOptions } from './visualRenderer.js'
import { webglAvailable } from './capabilities.js'
import { useVisibleArtworkMotion } from './artworkClock.js'

const moonMaps = ['moon', 'moonNormal'] as const

/** A canvas is phrasing content, so the decorative artwork is valid inside a button. */
export function ThemeToggleGlobe({ dark, active, animated = true }: { dark: boolean; active: boolean; animated?: boolean }) {
  return dark ? <Moon active={active} animated={animated} /> : <Sun active={active} animated={animated} />
}
function Moon({ active, animated }: { active: boolean; animated: boolean }) {
  const maps = usePanelTextures(moonMaps)
  return <Sphere dark active={active} animated={animated} textures={maps.textures} />
}
function Sun({ active, animated }: { active: boolean; animated: boolean }) {
  const [textures, setTextures] = useState<TextureSet>({})
  useEffect(() => {
    let active = true
    loadTextures(['sun']).then((result) => { if (active) setTextures(result.textures) })
    return () => { active = false }
  }, [])
  return <Sphere dark={false} active={active} animated={animated} textures={textures} />
}

/** Limb darkening makes the self-lit Sun read as a sphere at control sizes. */
function solarRelief(model: PlanetObject) {
  model.body.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.geometry.type !== 'SphereGeometry' || !(object.material instanceof THREE.MeshBasicMaterial)) return
    const material = object.material
    const previous = material.onBeforeCompile
    material.onBeforeCompile = function (shader, renderer) {
      previous.call(this, shader, renderer)
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vToggleNormal;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvToggleNormal = normalize(normalMatrix * normal);')
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vToggleNormal;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float limb = pow(max(0.0, normalize(vToggleNormal).z), .45);
          diffuseColor.rgb *= .60 + .40 * limb;
          float crown = pow(max(0.0, dot(normalize(vToggleNormal), normalize(vec3(-.45, .6, 1.0)))), 8.0);
          diffuseColor.rgb += vec3(.16, .09, .015) * crown;`)
    }
    material.customProgramCacheKey = () => 'skydial-toggle-solar-relief'
  })
}

/** Only the visible, active Sun runs a budgeted decorative scene. */
function Sphere({ dark, active, animated, textures }: { dark: boolean; active: boolean; animated: boolean; textures: CelestialTextures }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const surface = useRef<{ gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; model: PlanetObject | null; draw: () => void } | null>(null)
  const previousActive = useRef(active)
  const solarSeconds = useRef(0)
  const [ready, setReady] = useState(false)
  const { quality, maxFps } = useRenderOptions()
  const motion = useVisibleArtworkMotion(canvas, animated)
  useEffect(() => {
    const host = canvas.current
    if (!host || !webglAvailable()) return
    let gl: THREE.WebGLRenderer
    try { gl = new THREE.WebGLRenderer({ canvas: host, alpha: true, antialias: true }) } catch { return }
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.setPixelRatio(quality === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 2))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 20)
    camera.position.z = 3.4
    scene.add(new THREE.AmbientLight('#b9c9e4', dark ? .16 : .45))
    const light = new THREE.DirectionalLight('#fff9ee', dark ? 4.5 : 2.5)
    light.position.set(-4, 2.5, dark ? 2.8 : 5)
    scene.add(light)
    let lost = false
    const draw = () => { if (!lost) { gl.render(scene, camera); setReady(true) } }
    const resize = () => {
      const width = host.clientWidth, height = host.clientHeight
      if (!width || !height) return
      gl.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      draw()
    }
    const lose = (event: Event) => { event.preventDefault(); lost = true; setReady(false) }
    host.addEventListener('webglcontextlost', lose)
    surface.current = { gl, scene, camera, model: null, draw }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()
    return () => {
      lost = true
      observer.disconnect()
      host.removeEventListener('webglcontextlost', lose)
      surface.current = null
      gl.dispose()
      gl.forceContextLoss()
    }
  }, [quality, dark])
  useEffect(() => {
    const view = surface.current
    if (!view) return
    const model = dark ? createMoonObject(textures, 64) : createSunObject(textures, 64)
    if (!dark) {
      model.root.scale.setScalar(1 / SUN_DISPLAY_RADIUS)
      solarRelief(model)
      model.updateArtwork?.(solarSeconds.current)
    }
    view.model = model
    model.body.rotation.z = dark ? -.15 : -.08
    view.scene.add(model.root)
    view.draw()
    return () => { view.model = null; view.scene.remove(model.root); model.dispose() }
  }, [dark, textures, quality])
  useEffect(() => {
    const view = surface.current, host = canvas.current
    const changed = previousActive.current !== active
    previousActive.current = active
    if (!view?.model || !host) return
    const model = view.model
    const target = active ? .12 : -.42
    const solar = motion && active && !dark
    let frame = 0
    const finish = () => {
      cancelAnimationFrame(frame)
      model.body.rotation.y = target + (dark ? 0 : solarSeconds.current * .035)
      host.dataset.motion = 'idle'
      view.draw()
    }
    if (!motion || !changed && !solar) { finish(); return }
    const from = model.body.rotation.y, start = performance.now()
    let lastDraw = start, lastFrame = start
    host.dataset.motion = solar ? 'solar' : 'turning'
    const turn = (now: number) => {
      const t = Math.min(1, (now - start) / 200)
      if (t === 1 && !solar) { finish(); return }
      const delta = Math.min(.1, (now - lastFrame) / 1000)
      lastFrame = now
      if (solar) solarSeconds.current += delta
      if (now - lastDraw >= 1000 / Math.min(maxFps, solar ? 20 : 60)) {
        const base = target + (dark ? 0 : solarSeconds.current * .035)
        model.body.rotation.y = changed && t < 1 ? from + (base - from) * (1 - (1 - t) ** 3) : base
        if (solar) {
          model.updateArtwork?.(solarSeconds.current * 1.8)
          host.dataset.solarSeconds = solarSeconds.current.toFixed(3)
        }
        view.draw(); lastDraw = now
      }
      frame = requestAnimationFrame(turn)
    }
    frame = requestAnimationFrame(turn)
    return () => {
      cancelAnimationFrame(frame)
      host.dataset.motion = 'idle'
    }
  }, [active, dark, motion, maxFps, quality, textures])
  return <canvas ref={canvas} data-toggle-globe={dark ? 'moon' : 'sun'} data-ready={ready} data-motion="idle" aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%', opacity: ready ? 1 : 0 }} />
}

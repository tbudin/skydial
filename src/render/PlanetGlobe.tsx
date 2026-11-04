import { SceneCanvas } from './SceneCanvas.js'
import { ClockFrames } from './ClockFrames.js'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from 'three'
import type { PlanetId } from '../astro/bodies.js'
import { PLANET_BY_ID, SATURN_RING_OUTER } from '../astro/bodies.js'
import { bodyAxes } from '../astro/ephemeris.js'
import { applyBodyAxes, createPlanetObject, DISPLAY_RADIUS } from './planetFactory.js'
import { loadTextures, type TextureSet } from './textures.js'
import { useVisualClock } from '../sim/hooks.js'
import { useRenderOptions } from './visualRenderer.js'
import { ILLUSTRATION_CAMERA_DISTANCE, ILLUSTRATION_FOV } from './illustration.js'

type GlobePlanet = Exclude<PlanetId, 'earth'>

export function PlanetGlobe({ planet, illustration = false }: { planet: GlobePlanet; illustration?: boolean }) {
  const { quality } = useRenderOptions()
  const detail = illustration && quality !== 'low' ? 'detailed' : 'compact'
  const [textures, setTextures] = useState<TextureSet | null>(null)
  const [ready, setReady] = useState<GlobePlanet | null>(null)
  useEffect(() => {
    let active = true
    loadTextures(planet === 'saturn' ? ['saturn', 'saturnRing'] : [planet], detail).then((result) => { if (active) setTextures(result.textures) })
    return () => { active = false }
  }, [planet, detail])
  // Saturn reserves space for its complete rings rather than cropping the illustration.
  const distance = ILLUSTRATION_CAMERA_DISTANCE * (planet === 'saturn' ? SATURN_RING_OUTER : 1)
  return <div className="planet-globe" data-planet={planet} data-ready={ready === planet} style={{ width: '100%', height: '100%' }}><SceneCanvas illustration={illustration} frameloop="demand" camera={illustration ? { position: [0, 0, distance], fov: ILLUSTRATION_FOV } : { position: [0, 1.3, 6], fov: planet === 'saturn' ? 44 : 38 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
    <PlanetFraming planet={planet} illustration={illustration} distance={distance} />
    <ClockFrames />
    <ambientLight intensity={0.24} /><directionalLight position={[4, 2, 6]} intensity={2.6} />
    {textures && <PlanetMesh key={planet} planet={planet} textures={textures} onReady={() => setReady(planet)} />}
  </SceneCanvas></div>
}

/** Canvas camera options initialize once; apply framing when the chosen planet changes. */
function PlanetFraming({ planet, illustration, distance }: { planet: GlobePlanet; illustration: boolean; distance: number }) {
  const { camera, invalidate } = useThree()
  useLayoutEffect(() => {
    camera.position.set(0, illustration ? 0 : 1.3, illustration ? distance : 6)
    camera.lookAt(0, 0, 0)
    if (camera instanceof PerspectiveCamera) {
      // eslint-disable-next-line react/immutability -- Three.js owns this mutable scene camera.
      camera.fov = illustration ? ILLUSTRATION_FOV : planet === 'saturn' ? 44 : 38
      camera.updateProjectionMatrix()
    }
    invalidate()
  }, [camera, invalidate, planet, illustration, distance])
  return null
}

function PlanetMesh({ planet, textures, onReady }: { planet: GlobePlanet; textures: TextureSet; onReady: () => void }) {
  const clock = useVisualClock()
  const presented = useRef(false)
  const readyFrame = useRef(0)
  useEffect(() => () => cancelAnimationFrame(readyFrame.current), [])
  const object = useMemo(() => {
    const model = createPlanetObject(planet, textures, 128)
    model.root.scale.setScalar(1 / DISPLAY_RADIUS[planet])
    if (model.ringShadow) {
      model.ringShadow.uPlanetRadius.value = 1
      model.ringShadow.uSunPos.value.set(4, 2, 6)
    }
    return model
  }, [planet, textures])
  useEffect(() => () => object.dispose(), [object])
  useFrame(() => {
    applyBodyAxes(object.body, bodyAxes(PLANET_BY_ID[planet].body, clock.now()))
    if (!presented.current) {
      presented.current = true
      // Report readiness after the first textured frame has been presented.
      readyFrame.current = requestAnimationFrame(onReady)
    }
  })
  return <primitive object={object.root} />
}

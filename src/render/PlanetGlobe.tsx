import { SceneCanvas } from './SceneCanvas.js'
import { ClockFrames } from './ClockFrames.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { PlanetId } from '../astro/bodies.js'
import { PLANET_BY_ID } from '../astro/bodies.js'
import { bodyAxes } from '../astro/ephemeris.js'
import { applyBodyAxes, createPlanetObject, DISPLAY_RADIUS } from './planetFactory.js'
import { loadTextures, type TextureSet } from './textures.js'
import { useVisualClock } from '../sim/hooks.js'

type GlobePlanet = Exclude<PlanetId, 'earth'>

export function PlanetGlobe({ planet }: { planet: GlobePlanet }) {
  const [textures, setTextures] = useState<TextureSet | null>(null)
  const [ready, setReady] = useState<GlobePlanet | null>(null)
  useEffect(() => {
    let active = true
    loadTextures().then((result) => { if (active) setTextures(result.textures) })
    return () => { active = false }
  }, [])
  return <div className="planet-globe" data-planet={planet} data-ready={ready === planet} style={{ width: '100%', height: '100%' }}><SceneCanvas frameloop="demand" camera={{ position: [0, 1.3, 6], fov: planet === 'saturn' ? 44 : 38 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
    <ClockFrames />
    <ambientLight intensity={0.24} /><directionalLight position={[4, 2, 6]} intensity={2.6} />
    {textures && <PlanetMesh key={planet} planet={planet} textures={textures} onReady={() => setReady(planet)} />}
  </SceneCanvas></div>
}

function PlanetMesh({ planet, textures, onReady }: { planet: GlobePlanet; textures: TextureSet; onReady: () => void }) {
  const clock = useVisualClock()
  const presented = useRef(false)
  const readyFrame = useRef(0)
  useEffect(() => () => cancelAnimationFrame(readyFrame.current), [])
  const object = useMemo(() => {
    const model = createPlanetObject(planet, textures)
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

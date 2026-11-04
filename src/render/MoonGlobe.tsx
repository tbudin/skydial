import { SceneCanvas } from './SceneCanvas.js'
import { ClockFrames } from './ClockFrames.js'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { moonView, type Location } from '../astro/observer.js'
import { useVisualClock } from '../sim/hooks.js'
import { applyAxesInWorld } from './planetFactory.js'
import { usePanelTextures } from './panelTextures.js'
import { ILLUSTRATION_CAMERA_DISTANCE, ILLUSTRATION_FOV } from './illustration.js'

/**
 * The Moon as the observer sees it. World frame = J2000 equatorial.
 * The Moon carries its IAU orientation (so libration appears naturally),
 * the camera looks from the observer's position with the zenith up, and the
 * only light comes from the Sun's computed direction. Phase, bright-limb
 * angle and tilt are therefore consequences of the geometry, not drawn on.
 */

export const MOON_CAMERA_DISTANCE = 6
export const MOON_FOV = 26

const KEYS = ['moon', 'moonNormal'] as const

export function MoonGlobe({ location, illustration = false }: { location: Location; illustration?: boolean }) {
  const tex = usePanelTextures(KEYS)
  const cameraDistance = illustration ? ILLUSTRATION_CAMERA_DISTANCE : MOON_CAMERA_DISTANCE
  return (
    <SceneCanvas
      illustration={illustration}
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: illustration ? ILLUSTRATION_FOV : MOON_FOV, near: 0.1, far: 50, position: [0, 0, cameraDistance] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
    >
      <ClockFrames />
      {tex.ready && <MoonScene location={location} textures={tex.textures} cameraDistance={cameraDistance} />}
    </SceneCanvas>
  )
}

function MoonScene({ location, textures, cameraDistance }: { location: Location; textures: Partial<Record<(typeof KEYS)[number], THREE.Texture>>; cameraDistance: number }) {
  const simClock = useVisualClock()
  const moon = useRef<THREE.Group>(null)
  const light = useRef<THREE.DirectionalLight>(null)
  const { camera } = useThree()
  const tmp = useMemo(() => ({ f: new THREE.Vector3(), up: new THREE.Vector3() }), [])

  useFrame(() => {
    const t = simClock.now()
    const m = moonView(location, t)
    if (moon.current) applyAxesInWorld(moon.current, m.moonFrame)
    light.current?.position.set(m.toSun.x * 20, m.toSun.y * 20, m.toSun.z * 20)
    tmp.f.set(m.toObserver.x, m.toObserver.y, m.toObserver.z)
    camera.position.copy(tmp.f).multiplyScalar(cameraDistance)
    tmp.up.set(m.zenith.x, m.zenith.y, m.zenith.z)
    tmp.up.addScaledVector(tmp.f, -tmp.up.dot(tmp.f)).normalize()
    camera.up.copy(tmp.up)
    camera.lookAt(0, 0, 0)
  })

  return (
    <>
      {/* Earthshine: a faint bluish fill on the night side */}
      <ambientLight intensity={0.035} color="#9fb4ff" />
      <directionalLight ref={light} intensity={3.6} />
      <group ref={moon}>
        <mesh>
          <sphereGeometry args={[1, 128, 64]} />
          <meshStandardMaterial
            map={textures.moon ?? null}
            color={textures.moon ? '#ffffff' : '#9a978f'}
            normalMap={textures.moonNormal ?? null}
            normalScale={new THREE.Vector2(0.6, 0.6)}
            roughness={1}
            metalness={0}
          />
        </mesh>
      </group>
    </>
  )
}

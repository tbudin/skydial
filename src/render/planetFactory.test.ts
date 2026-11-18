import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { PLANETS } from '../astro/bodies.js'
import { bodyAxes } from '../astro/ephemeris.js'
import { applyBodyAxes, createPlanetObject, createSunObject, createMoonObject } from './planetFactory.js'

describe('reusable 3D planet models', () => {
  for (const planet of PLANETS) {
    it(`${planet.id} has a real sphere and changes orientation with time`, () => {
      const model = createPlanetObject(planet.id, {})
      const mesh = model.body.children[0] as THREE.Mesh
      expect(mesh.isMesh).toBe(true)
      expect(mesh.geometry).toBeInstanceOf(THREE.SphereGeometry)
      expect(mesh.geometry.attributes.position.count).toBeGreaterThan(100)
      const start = Date.UTC(2026, 0, 1)
      applyBodyAxes(model.body, bodyAxes(planet.body, start))
      const before = model.body.quaternion.clone()
      applyBodyAxes(model.body, bodyAxes(planet.body, start + 3600000))
      expect(before.angleTo(model.body.quaternion)).toBeGreaterThan(0.00001)
      model.dispose()
    })
  }
  it('Saturn has a separate ring mesh with shadow uniforms', () => {
    const model = createPlanetObject('saturn', {})
    expect(model.body.children).toHaveLength(2)
    expect((model.body.children[1] as THREE.Mesh).geometry).toBeInstanceOf(THREE.RingGeometry)
    expect(model.ringShadow).toBeDefined()
    model.dispose()
  })
  for (const planet of ['saturn', 'uranus'] as const) {
    it(`${planet} material motion preserves its dated position, pole and ring plane`, () => {
      const model = createPlanetObject(planet, {})
      model.root.position.set(1, 2, 3)
      applyBodyAxes(model.body, bodyAxes(planet === 'saturn' ? 'Saturn' : 'Uranus', Date.UTC(2026, 10, 4)))
      const position = model.root.position.clone(), orientation = model.body.quaternion.clone()
      const ring = model.body.children[1] as THREE.Mesh
      const ringOrientation = ring.quaternion.clone()
      expect(model.updateArtwork).toBeTypeOf('function')
      model.updateArtwork!(25)
      model.updateArtwork!(0)
      expect(model.root.position.equals(position)).toBe(true)
      expect(model.body.quaternion.equals(orientation)).toBe(true)
      expect(ring.quaternion.equals(ringOrientation)).toBe(true)
      model.dispose()
    })
  }
})

describe('standalone Sun and Moon', () => {
  it('solar surface motion keeps the saved orientation fixed without flare geometry', () => {
    const model = createSunObject()
    applyBodyAxes(model.body, bodyAxes('Sun', Date.UTC(2026, 10, 4)))
    const orientation = model.body.quaternion.clone()
    expect(model.updateArtwork).toBeTypeOf('function')
    model.body.traverse((object) => {
      if (object instanceof THREE.Mesh) expect(object.geometry.type).not.toBe('TubeGeometry')
    })
    model.updateArtwork!(10)
    expect(model.body.quaternion.equals(orientation)).toBe(true)
    model.dispose()
  })
  for (const [body, create] of [['Sun', createSunObject], ['Moon', createMoonObject]] as const) {
    it(`${body} rotates and releases owned geometry without disposing caller textures`, () => {
      const texture = new THREE.Texture()
      const model = create({ sun: texture, moon: texture })
      const mesh = model.body.children[0] as THREE.Mesh
      expect(mesh.geometry).toBeInstanceOf(THREE.SphereGeometry)
      applyBodyAxes(model.body, bodyAxes(body, Date.UTC(2026, 0, 1)))
      const before = model.body.quaternion.clone()
      applyBodyAxes(model.body, bodyAxes(body, Date.UTC(2026, 0, 2)))
      expect(before.angleTo(model.body.quaternion)).toBeGreaterThan(0.001)
      let released = false
      let textureReleased = false
      mesh.geometry.addEventListener('dispose', () => { released = true })
      texture.addEventListener('dispose', () => { textureReleased = true })
      model.dispose()
      expect(released).toBe(true)
      expect(textureReleased).toBe(false)
    })
  }
})

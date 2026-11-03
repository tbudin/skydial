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
})

describe('standalone Sun and Moon', () => {
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

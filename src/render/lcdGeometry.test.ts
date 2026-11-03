import { describe, expect, it } from 'vitest'
import { cameraBasis, dot, norm, project, surfaceCoordinates, surfaceVector, worldAtPixel } from './lcdGeometry.js'
import { lcdLandAt } from './lcdLand.js'

const frame = { x: { x: 1, y: 0, z: 0 }, y: { x: 0, y: 1, z: 0 }, z: { x: 0, y: 0, z: 1 } }
describe('LCD spherical artwork', () => {
  it('keeps the pixel projection on the same geographic hemisphere as its camera', () => {
    const camera = cameraBasis(norm({ x: 1, y: .2, z: .6 }), frame.z)
    for (const [lat, lon] of [[0, 0], [35, 20], [75, -15], [-20, 10]]) {
      const position = surfaceVector(lat, lon, frame)
      const point = project(position, 92, camera)
      expect(point.visible).toBe(true)
      const inverse = surfaceCoordinates(worldAtPixel(point.x - 120, point.y - 120, 92, camera), frame)
      expect(inverse.lat).toBeCloseTo(lat, 8)
      expect(inverse.lon).toBeCloseTo(lon, 8)
    }
  })
  it('retains a finite orthonormal camera at either pole', () => {
    for (const front of [frame.z, { x: 0, y: 0, z: -1 }]) {
      const camera = cameraBasis(front, frame.z)
      expect(dot(camera.up, camera.front)).toBeCloseTo(0)
      expect(dot(camera.right, camera.front)).toBeCloseTo(0)
      expect(dot(camera.up, camera.right)).toBeCloseTo(0)
      expect(dot(camera.up, camera.up)).toBeCloseTo(1)
      expect(dot(camera.right, camera.right)).toBeCloseTo(1)
    }
  })
  it('retains recognisable islands, continents and open water in the original map', () => {
    for (const [lon, lat] of [[-.12, 51.5], [2.3, 48.8], [103.85, 1.29], [133, -25], [-60, -8], [18, -24]]) expect(lcdLandAt(lon, lat), `${lon}/${lat}`).toBe(true)
    for (const [lon, lat] of [[-140, 0], [-30, 0], [70, -30], [50, 42]]) expect(lcdLandAt(lon, lat), `${lon}/${lat}`).toBe(false)
  })
})

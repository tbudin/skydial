import { describe, expect, it } from 'vitest'
import { bodyFrameEqj, observerOf } from '../astro/observer.js'
import { earthCameraVector } from './earthCamera.js'

function cameraLongitude(observer: ReturnType<typeof observerOf>, time: number, view: 'observer' | 'rotation', epoch: number) {
  const vector = earthCameraVector(observer, time, view, epoch)
  const frame = bodyFrameEqj('Earth', time)
  const x = vector.x * frame.x.x + vector.y * frame.x.y + vector.z * frame.x.z
  const y = vector.x * frame.y.x + vector.y * frame.y.y + vector.z * frame.y.z
  return Math.atan2(y, x) * 180 / Math.PI
}
const separation = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180)

describe('Earth camera longitude', () => {
  const epoch = Date.UTC(2026, 2, 20, 12)
  for (const place of [{ latitude: 1.2903, longitude: 103.852 }, { latitude: 40.7128, longitude: -74.006 }, { latitude: -33.8688, longitude: 151.2093 }]) {
    it(`keeps longitude ${place.longitude} centered as time advances in city view`, () => {
      const observer = observerOf(place)
      for (const hours of [0, 6, 12, 24, 24 * 180]) {
        expect(separation(cameraLongitude(observer, epoch + hours * 3600000, 'observer', epoch), place.longitude)).toBeLessThan(.1)
      }
    })
  }
  it('lets Earth rotate away from the initial city in rotation view', () => {
    const observer = observerOf({ latitude: 1.2903, longitude: 103.852 })
    expect(separation(cameraLongitude(observer, epoch + 6 * 3600000, 'rotation', epoch), cameraLongitude(observer, epoch, 'rotation', epoch))).toBeGreaterThan(89)
  })
})

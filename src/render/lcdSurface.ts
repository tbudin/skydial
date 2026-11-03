import type { PlanetId } from '../astro/bodies.js'
import { noise, spot } from './lcdGeometry.js'

// Original, illustrative markings. They identify each world without using a
// photographic texture or implying a measured weather map at the selected time.
export const JUPITER_STORM_LON = -15
export const NEPTUNE_STORM_LON = 150

export const LUNAR_MARIA = [
  [-43, 18, 25, 31], [-16, 33, 19, 14], [18, 28, 13, 12], [31, 8, 18, 12],
  [59, 17, 12, 10], [51, -7, 12, 16], [35, -16, 10, 9], [-16, -21, 13, 13],
  [-39, -24, 10, 10], [1, 56, 35, 6],
] as const
export const LUNAR_CRATERS: readonly (readonly number[])[] = [
  [-11, -43, 4], [-20, 10, 4.5], [-38, 8, 2.7], [-9, 52, 3.5], [-47, 24, 2.5],
  [-14, -58, 6], [61, -9, 4], [60, -25, 4.5], [-54, -45, 6], [-68, -5, 5],
  ...Array.from({ length: 62 }, (_, i) => [((i * 137.508 + 23) % 360) - 180, Math.asin(((i * .754877666 + .17) % 1) * 1.8 - .9) * 180 / Math.PI, 1.2 + (i * 7 % 13) / 5]),
]
export function moonSurface(lon: number, lat: number) {
  const sea = LUNAR_MARIA.some(([x, y, rx, ry]) => spot(lon, lat, x, y, rx, ry) < 1 + noise(lon, lat) * .12)
  return (sea ? .66 : .09) + noise(lon, lat) * (sea ? .16 : .08)
}
const band = (latitude: number, boundaries: readonly number[], densities: readonly number[]) => densities[boundaries.findIndex((edge) => latitude < edge)] ?? densities[densities.length - 1]
export function planetSurface(body: Exclude<PlanetId, 'earth'>, lon: number, lat: number) {
  const grain = noise(lon, lat)
  if (body === 'jupiter') {
    const latitude = lat + 1.8 * Math.sin(lon * .11 + lat * .06) + .8 * Math.sin(lon * .31 - lat * .15)
    const bands = band(latitude, [-68, -53, -43, -31, -24, -13, -6, 6, 14, 25, 34, 45, 58, 70], [.48, .26, .58, .24, .7, .47, .18, .1, .56, .72, .22, .5, .23, .45, .6])
    const storm = spot(lon, lat, JUPITER_STORM_LON, -22, 18, 7.5)
    if (storm < 1.25) return storm > .85 ? .95 : storm > .45 ? .18 : .66
    const oval = spot(lon, lat, -58, -34, 9, 3)
    return oval < 1 ? .08 : bands + grain * .14
  }
  if (body === 'saturn') {
    const latitude = lat + Math.sin(lon * .06 + lat * .1) * .8
    return band(latitude, [-62, -43, -31, -17, -6, 8, 20, 34, 49, 65], [.4, .29, .41, .2, .42, .16, .3, .42, .18, .35, .5]) + grain * .08
  }
  if (body === 'uranus') {
    const cap = lat > 57 ? .08 : lat > 43 ? .27 : .17
    return cap + .12 * Math.sin((lat + grain * 1.2) * .22) ** 6 + grain * .05
  }
  if (body === 'neptune') {
    const storm = spot(lon, lat, NEPTUNE_STORM_LON, -24, 17, 8)
    const cloud = spot(lon, lat, NEPTUNE_STORM_LON + 23, -17, 23, 2.5)
    return storm < 1 ? .88 + grain * .1 : cloud < 1 ? .02 : band(lat + grain * 1.4, [-60, -42, -27, -16, -5, 12, 27, 42, 60], [.5, .3, .55, .34, .6, .25, .45, .32, .6, .42]) + grain * .09
  }
  if (body === 'venus') return .25 + .25 * Math.sin(lat * .12 + Math.sin(lon * .05) * 2.4) ** 4 + grain * .11
  if (body === 'mars') {
    if (Math.abs(lat) > 72 + grain * 4) return .02
    const dark = spot(lon, lat, 70, -12, 30, 21) < 1 || spot(lon, lat, -55, -28, 42, 16) < 1 || spot(lon, lat, 5, 18, 18, 24) < 1
    return (dark ? .64 : .2) + grain * .13
  }
  let density = .24 + grain * .14
  for (const [x, y, radius] of LUNAR_CRATERS.slice(10, 32)) {
    const crater = spot(lon, lat, x, y, radius * 1.8, radius * 1.3)
    if (crater < 1.4 && crater > .7) density += .42
    else if (crater < .65) density -= .13
  }
  return density
}

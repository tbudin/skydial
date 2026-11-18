/** Decorative material motion. Seconds are presentation time, never ephemeris time. */
export const RING_EXTENTS = {
  saturn: { inner: 1.239, outer: 2.27 },
  uranus: { inner: 1.62, outer: 2.02 },
} as const

/** Main narrow Uranian rings, in equatorial radii; widths enlarged for legibility. */
export const URANUS_RING_BANDS = [1.637, 1.652, 1.666, 1.75, 1.786, 1.846, 1.863, 1.89, 1.957, 2.001] as const

/** Differential drift leaves the ring plane and all body transforms untouched. */
export function ringMaterialMotion(radius: number, angle: number, seconds: number) {
  const phase = angle - seconds * .28 / Math.pow(Math.max(1, radius), 1.5)
  return .84 + .10 * Math.sin(phase * 31 + radius * 271) + .06 * Math.sin(phase * 73 - radius * 911)
}

/** Illustrative convection; this does not represent observed or predicted solar activity. */
export function solarSurfaceMotion(lon: number, lat: number, seconds: number) {
  const x = lon + .025 * Math.sin(lat * 11 + seconds * .24)
  const y = lat + .018 * Math.sin(lon * 13 - seconds * .19)
  return .82 + .13 * Math.sin(x * 57 + Math.sin(y * 37 + seconds * .21)) * Math.sin(y * 63 - seconds * .17) + .05 * Math.sin(x * 137 + y * 91 + seconds * .31)
}

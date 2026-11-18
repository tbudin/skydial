import { useId } from 'react'
import { cameraBasis, norm, stippleDisc, surfaceCoordinates, surfacePath } from '../render/lcdGeometry.js'
import { LUNAR_CRATERS, moonSurface } from '../render/lcdSurface.js'

// The widget's lunar surface and engraved stipple, simplified for a 24px control.
const frame = { x: { x: 1, y: 0, z: 0 }, y: { x: 0, y: 1, z: 0 }, z: { x: 0, y: 0, z: 1 } }
const camera = cameraBasis(norm({ x: 1, y: .1, z: .15 }), frame.z)
const maria = stippleDisc(88, (x, y, z) => {
  const world = { x: camera.right.x * x + camera.up.x * y + camera.front.x * z, y: camera.right.y * x + camera.up.y * y + camera.front.y * z, z: camera.right.z * x + camera.up.z * y + camera.front.z * z }
  const { lat, lon } = surfaceCoordinates(world, frame)
  return moonSurface(lon, lat)
}, 9, 5)
const craters = LUNAR_CRATERS.slice(0, 10).map(([lon, lat, r]) => surfacePath(Array.from({ length: 33 }, (_, i) => {
  const angle = i / 32 * Math.PI * 2
  return [lon + Math.cos(angle) * r / Math.max(.2, Math.cos(lat * Math.PI / 180)), lat + Math.sin(angle) * r]
}), 88, frame, camera))
const granules = stippleDisc(66, (x, y) => .24 + .2 * Math.sin(x * 14 + y * 8) ** 2, 9, 4)

export function SunIllustration() {
  return <svg viewBox="0 0 240 240" aria-hidden="true" focusable="false" data-toggle-illustration="sun" fill="none" stroke="currentColor">
    <circle cx="120" cy="120" r="66" strokeWidth="9" />
    <path d={granules} fill="currentColor" stroke="none" />
    {Array.from({ length: 12 }, (_, i) => {
      const a = i / 12 * Math.PI * 2
      return <path key={i} d={`M${120 + Math.cos(a) * 84},${120 + Math.sin(a) * 84}L${120 + Math.cos(a) * 106},${120 + Math.sin(a) * 106}`} strokeWidth="9" />
    })}
  </svg>
}

export function MoonIllustration() {
  const id = useId().replaceAll(':', '')
  return <svg viewBox="0 0 240 240" aria-hidden="true" focusable="false" data-toggle-illustration="moon" fill="none" stroke="currentColor">
    <defs><clipPath id={`${id}-moon`}><circle cx="120" cy="120" r="88" /></clipPath></defs>
    <circle cx="120" cy="120" r="88" strokeWidth="9" />
    <g clipPath={`url(#${id}-moon)`}>
      <path d="M120 32A88 88 0 0 1 120 208A48 88 0 0 0 120 32Z" fill="currentColor" stroke="none" />
      <path d={maria} fill="currentColor" stroke="none" />
      <g strokeWidth="5">{craters.map((path, i) => <path key={i} d={path} />)}</g>
    </g>
  </svg>
}

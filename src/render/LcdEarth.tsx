import { useId, useMemo, useState } from 'react'
import { earthView, type Location, type V3 } from '../astro/observer.js'
import { useVisualNow } from '../ui/hooks.js'
import { cameraBasis, DEG, dot, illuminatedPath, noise, stippleDisc, surfaceCoordinates, surfacePath } from './lcdGeometry.js'
import { LCD_LAND, LCD_LAKES, lcdLandAt } from './lcdLand.js'

function coastCoordinates(shape: readonly (readonly number[])[]) {
  return shape.flatMap(([lon, lat], i) => {
    const next = shape[(i + 1) % shape.length]
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(next[0] - lon), Math.abs(next[1] - lat)) / 2))
    return Array.from({ length: steps }, (_, j) => [lon + (next[0] - lon) * j / steps, lat + (next[1] - lat) * j / steps])
  }).concat([[shape[0][0], shape[0][1]]])
}
const coastlines = [...LCD_LAND, ...LCD_LAKES].map(coastCoordinates)

/** Detailed geographic dots retain the computed Earth frame and day/night boundary. */
export function LcdEarth({ location, view = 'observer' }: { location: Location; view?: 'observer' | 'rotation' }) {
  const now = useVisualNow(33)
  const key = useId().replaceAll(':', '')
  const [epoch] = useState(now)
  const { latitude, longitude, elevationM } = location
  const reading = useMemo(() => earthView({ latitude, longitude, elevationM }, now), [latitude, longitude, elevationM, now])
  const fixed = useMemo(() => earthView({ latitude, longitude, elevationM }, epoch).observerDir, [latitude, longitude, elevationM, epoch])
  const camera = cameraBasis(view === 'observer' ? reading.observerDir : fixed, reading.earthFrame.z)
  const frame = reading.earthFrame
  const world = (x: number, y: number, z: number): V3 => ({
    x: camera.right.x * x + camera.up.x * y + camera.front.x * z,
    y: camera.right.y * x + camera.up.y * y + camera.front.y * z,
    z: camera.right.z * x + camera.up.z * y + camera.front.z * z,
  })
  const dots = stippleDisc(92, (x, y, z) => {
    const point = world(x, y, z)
    const { lat, lon } = surfaceCoordinates(point, frame)
    return lcdLandAt(lon, lat) ? .7 + noise(lon, lat) * .12 : 0
  })
  const night = illuminatedPath(92, -dot(camera.front, reading.sunDir))
  const nightAngle = Math.atan2(dot(reading.sunDir, camera.up), -dot(reading.sunDir, camera.right)) / DEG
  const path = (coordinates: readonly (readonly number[])[]) => surfacePath(coordinates, 92, frame, camera)
  const coasts = coastlines.map(path).join('')
  return <svg className="lcd-earth lcd-body" data-renderer="lcd" data-lcd-body="earth" viewBox="0 0 240 240" width="100%" height="100%" aria-hidden="true" focusable="false">
    <defs><clipPath id={`${key}-night`}><path d={night} transform={`rotate(${nightAngle} 120 120)`} /></clipPath></defs>
    <circle cx="120" cy="120" r="92" className="lcd-paper-fill" stroke="currentColor" strokeWidth="1.5" />
    <g data-lcd-feature="graticule" stroke="currentColor" strokeWidth=".55" fill="none" strokeDasharray="1 4">
      {[-60, -30, 0, 30, 60].map((lat) => <path key={`lat${lat}`} d={path(Array.from({ length: 181 }, (_, i) => [i * 2 - 180, lat]))} />)}
      {Array.from({ length: 12 }, (_, i) => i * 30).map((lon) => <path key={`lon${lon}`} d={path(Array.from({ length: 91 }, (_, i) => [lon, i * 2 - 90]))} />)}
    </g>
    <path data-lcd-feature="land" d={dots} fill="currentColor" />
    <path data-lcd-feature="coastlines" d={coasts} fill="none" stroke="currentColor" strokeWidth=".7" strokeLinejoin="round" />
    <path data-lcd-feature="night" d={night} transform={`rotate(${nightAngle} 120 120)`} fill="currentColor" />
    <g clipPath={`url(#${key}-night)`}>
      <path d={dots} className="lcd-paper-fill" />
      <path d={coasts} fill="none" stroke="var(--lcd-paper)" strokeWidth=".7" strokeLinejoin="round" />
    </g>
    <circle cx="120" cy="120" r="92" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M120 18v7M120 215v7M18 120h7M215 120h7" stroke="currentColor" strokeWidth="1.5" />
  </svg>
}

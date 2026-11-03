import { useId } from 'react'
import type { PlanetId } from '../astro/bodies.js'
import { bodyAxes } from '../astro/ephemeris.js'
import { moonView, type BodyFrame, type Location } from '../astro/observer.js'
import { useSimNow } from '../ui/hooks.js'
import { cameraBasis, DEG, dot, illuminatedPath, norm, project, stippleDisc, surfaceCoordinates, surfacePath, type LcdCamera } from './lcdGeometry.js'
import { JUPITER_STORM_LON, NEPTUNE_STORM_LON, LUNAR_CRATERS, moonSurface, planetSurface } from './lcdSurface.js'

export type LcdBodyId = Exclude<PlanetId, 'earth'> | 'moon'
const front = norm({ x: 1, y: .15, z: .4 })
const planetCamera = cameraBasis(front, { x: 0, y: 0, z: 1 })
const circleCoordinates = (lon: number, lat: number, radius: number, ratio = 1) => Array.from({ length: 65 }, (_, i) => {
  const angle = i / 64 * Math.PI * 2
  return [lon + Math.cos(angle) * radius * ratio / Math.max(.2, Math.cos(lat * DEG)), lat + Math.sin(angle) * radius]
})

function RingSystem({ frame, camera, radius, near = false, narrow = false }: { frame: BodyFrame; camera: LcdCamera; radius: number; near?: boolean; narrow?: boolean }) {
  const from = Math.atan2(dot(frame.y, camera.front), dot(frame.x, camera.front)) - Math.PI / 2
  const ringPoint = (r: number, angle: number) => project({ x: (frame.x.x * Math.cos(angle) + frame.y.x * Math.sin(angle)) * r, y: (frame.x.y * Math.cos(angle) + frame.y.y * Math.sin(angle)) * r, z: (frame.x.z * Math.cos(angle) + frame.y.z * Math.sin(angle)) * r }, radius, camera)
  const coordinates = (r: number, reverse = false) => Array.from({ length: 129 }, (_, i) => {
    const angle = (near ? from : 0) + (reverse ? 128 - i : i) / 128 * Math.PI * (near ? 1 : 2)
    return ringPoint(r, angle)
  })
  const path = (points: { x: number; y: number }[]) => points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('')
  const inner = narrow ? 1.42 : 1.24
  const outer = narrow ? 1.68 : 2.27
  const boundary = path(coordinates(outer)) + path(coordinates(inner, true)).replace('M', 'L') + 'Z'
  const bands = narrow ? [1.42, 1.49, 1.59, 1.68] : [1.24, 1.34, 1.43, 1.53, 1.63, 1.73, 1.83, 1.93, 2.04, 2.13, 2.22, 2.27]
  return <g data-lcd-feature={near ? 'rings-front' : 'rings-back'}>
    <path d={boundary} className="lcd-paper-fill" stroke="none" fillRule="evenodd" />
    {bands.map((r, i) => <path key={r} d={path(coordinates(r))} strokeWidth={narrow ? .65 : i === 0 || i === bands.length - 1 ? 1.3 : .75} strokeDasharray={!narrow && i % 3 === 1 ? '1 1.6' : undefined} />)}
  </g>
}

/** Original engraved surfaces, projected onto spheres with the computed body rotation. */
export function LcdBody({ body, location }: { body: LcdBodyId; location: Location }) {
  const now = useSimNow(100)
  const key = useId().replaceAll(':', '')
  const moon = body === 'moon' ? moonView(location, now) : null
  const frame = moon?.moonFrame ?? bodyAxes(body[0].toUpperCase() + body.slice(1), now)
  const camera = moon ? cameraBasis(moon.toObserver, frame.z) : planetCamera
  const radius = body === 'saturn' ? 49 : body === 'uranus' ? 64 : 86
  const ringed = body === 'saturn' || body === 'uranus'
  const markings = stippleDisc(radius, (x, y, z) => {
    const world = { x: camera.right.x * x + camera.up.x * y + camera.front.x * z, y: camera.right.y * x + camera.up.y * y + camera.front.y * z, z: camera.right.z * x + camera.up.z * y + camera.front.z * z }
    const { lat, lon } = surfaceCoordinates(world, frame)
    const texture = body === 'moon' ? moonSurface(lon, lat) : planetSurface(body, lon, lat)
    const shade = moon ? Math.max(0, 1 - z) * .13 : Math.max(0, .55 - (-x * .45 + y * .3 + z * .8)) * .38
    return texture + shade
  }, body === 'saturn' ? 2.2 : 2.7, body === 'saturn' ? 1.2 : 1.5)
  const lit = moon ? illuminatedPath(radius, dot(moon.toObserver, moon.toSun)) : ''
  const lightAngle = moon ? Math.atan2(-dot(moon.toSun, camera.up), dot(moon.toSun, camera.right)) / DEG : 0
  const bandLatitudes = body === 'jupiter' ? [-58, -44, -31, -24, -13, -6, 7, 14, 25, 34, 46, 60] : body === 'saturn' ? [-60, -40, -20, -8, 8, 24, 44, 62] : body === 'uranus' ? [-55, -15, 20, 48, 65] : body === 'neptune' ? [-42, -28, -7, 12, 35, 55] : body === 'venus' ? [-60, -35, -10, 20, 45, 65] : []
  const bandPaths = bandLatitudes.map((lat) => surfacePath(Array.from({ length: 181 }, (_, i) => {
    const lon = i * 2 - 180
    const wave = body === 'jupiter' ? 1.8 * Math.sin(lon * .11 + lat * .06) + .8 * Math.sin(lon * .31 - lat * .15) : body === 'venus' ? 10 * Math.sin(lon * .05 + lat * .04) : Math.sin(lon * .06 + lat * .1) * .8
    return [lon, lat - wave]
  }), radius, frame, camera))
  const craterPaths = body === 'moon' || body === 'mercury' ? LUNAR_CRATERS.map(([lon, lat, r]) => surfacePath(circleCoordinates(lon, lat, r), radius, frame, camera)) : []
  return <svg className="lcd-body" data-renderer="lcd" data-lcd-body={body} viewBox="0 0 240 240" width="100%" height="100%" aria-hidden="true" focusable="false" stroke="currentColor" fill="none">
    <defs>
      <clipPath id={`${key}-disc`}><circle cx="120" cy="120" r={radius} /></clipPath>
      {moon && <clipPath id={`${key}-light`}><path d={lit} transform={`rotate(${lightAngle} 120 120)`} /></clipPath>}
    </defs>
    {ringed && <RingSystem frame={frame} camera={camera} radius={radius} narrow={body === 'uranus'} />}
    <circle cx="120" cy="120" r={radius} className={moon ? undefined : 'lcd-paper-fill'} fill={moon ? 'currentColor' : undefined} strokeWidth="1.5" />
    {moon && <path data-lcd-feature="illuminated" d={lit} transform={`rotate(${lightAngle} 120 120)`} className="lcd-paper-fill" stroke="none" />}
    <g clipPath={`url(#${key}-${moon ? 'light' : 'disc'})`}>
      <path data-lcd-feature={moon ? 'maria' : 'atmosphere'} d={markings} fill="currentColor" stroke="none" />
      {bandPaths.length > 0 && <g data-lcd-feature="cloud-bands" strokeWidth={body === 'jupiter' ? .75 : .55} strokeDasharray={body === 'uranus' ? '1 2' : undefined}>{bandPaths.map((d, i) => <path key={i} d={d} />)}</g>}
      {craterPaths.length > 0 && <g data-lcd-feature="craters" strokeWidth=".8">{craterPaths.map((d, i) => <path key={i} d={d} />)}{LUNAR_CRATERS.slice(0, 10).map(([lon, lat, r], i) => <path key={`inner${i}`} d={surfacePath(circleCoordinates(lon, lat, r * .55), radius, frame, camera)} strokeWidth=".45" />)}</g>}
      {body === 'moon' && <g data-lcd-feature="rays" strokeWidth=".55">{Array.from({ length: 11 }, (_, i) => {
        const angle = i / 11 * Math.PI * 2
        const a = surfacePath([[-11 + Math.cos(angle) * 5, -43 + Math.sin(angle) * 5], [-11 + Math.cos(angle) * (14 + i % 3 * 3), -43 + Math.sin(angle) * (14 + i % 3 * 3)]], radius, frame, camera)
        return <path key={i} d={a} />
      })}</g>}
      {body === 'jupiter' && <g data-lcd-feature="storm" strokeWidth=".7">{[1, .72, .37].map((scale) => <path key={scale} d={surfacePath(circleCoordinates(JUPITER_STORM_LON, -22, 7.5 * scale, 2.25), radius, frame, camera)} />)}</g>}
      {body === 'neptune' && <g data-lcd-feature="storm" strokeWidth=".7">{[1, .72].map((scale) => <path key={scale} d={surfacePath(circleCoordinates(NEPTUNE_STORM_LON, -24, 8 * scale, 2.1), radius, frame, camera)} />)}</g>}
      {body === 'mars' && <path data-lcd-feature="polar-caps" d={surfacePath(Array.from({ length: 181 }, (_, i) => [i * 2 - 180, 72]), radius, frame, camera)} strokeWidth=".65" />}
    </g>
    <circle cx="120" cy="120" r={radius} strokeWidth="1.5" />
    {ringed && <RingSystem frame={frame} camera={camera} radius={radius} near narrow={body === 'uranus'} />}
    {!ringed && <path d="M120 21v6M120 213v6M21 120h6M213 120h6" strokeWidth="1.2" />}
  </svg>
}

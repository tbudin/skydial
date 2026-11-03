import type { BodyFrame, V3 } from '../astro/observer.js'

export const DEG = Math.PI / 180
export const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z
export const cross = (a: V3, b: V3): V3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x })
export const norm = (v: V3): V3 => {
  const length = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / length, y: v.y / length, z: v.z / length }
}
export function cameraBasis(front: V3, north: V3) {
  const component = dot(north, front)
  let up = { x: north.x - front.x * component, y: north.y - front.y * component, z: north.z - front.z * component }
  if (Math.hypot(up.x, up.y, up.z) < 1e-6) {
    const fallback = Math.abs(front.y) < .9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }
    up = cross(front, cross(fallback, front))
  }
  up = norm(up)
  return { front, up, right: norm(cross(up, front)) }
}
export type LcdCamera = ReturnType<typeof cameraBasis>

export function surfaceVector(latitude: number, longitude: number, frame: BodyFrame): V3 {
  const lat = latitude * DEG; const lon = longitude * DEG
  const x = Math.cos(lat) * Math.cos(lon); const y = Math.cos(lat) * Math.sin(lon); const z = Math.sin(lat)
  return { x: x * frame.x.x + y * frame.y.x + z * frame.z.x, y: x * frame.x.y + y * frame.y.y + z * frame.z.y, z: x * frame.x.z + y * frame.y.z + z * frame.z.z }
}
export function surfaceCoordinates(v: V3, frame: BodyFrame) {
  return { lat: Math.asin(Math.max(-1, Math.min(1, dot(v, frame.z)))) / DEG, lon: Math.atan2(dot(v, frame.y), dot(v, frame.x)) / DEG }
}
export function worldAtPixel(x: number, y: number, radius: number, camera: LcdCamera): V3 {
  const a = x / radius; const b = -y / radius; const z = Math.sqrt(Math.max(0, 1 - a * a - b * b))
  return { x: camera.right.x * a + camera.up.x * b + camera.front.x * z, y: camera.right.y * a + camera.up.y * b + camera.front.y * z, z: camera.right.z * a + camera.up.z * b + camera.front.z * z }
}
export function project(v: V3, radius: number, camera: LcdCamera) {
  return { x: 120 + radius * dot(v, camera.right), y: 120 - radius * dot(v, camera.up), visible: dot(v, camera.front) >= 0 }
}
export function surfacePath(coordinates: readonly (readonly number[])[], radius: number, frame: BodyFrame, camera: LcdCamera) {
  let visible = false
  return coordinates.map(([lon, lat]) => {
    const p = project(surfaceVector(lat, lon, frame), radius, camera)
    const command = p.visible ? `${visible ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}` : ''
    visible = p.visible
    return command
  }).join('')
}

// Ordered dithering uses only ink and paper: no grey, opacity or raster textures.
const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
export function stippleDisc(radius: number, sample: (x: number, y: number, z: number) => number, spacing = 2.8, size = 1.55) {
  let path = ''
  const extent = Math.floor((radius - size) / spacing)
  for (let row = -extent; row <= extent; row++) for (let col = -extent; col <= extent; col++) {
    const x = col * spacing; const y = row * spacing
    if (x * x + y * y >= (radius - size / 2) ** 2) continue
    const density = sample(x / radius, -y / radius, Math.sqrt(1 - (x * x + y * y) / radius ** 2))
    const threshold = (bayer[((row % 4 + 4) % 4) * 4 + (col % 4 + 4) % 4] + .5) / 16
    if (density >= threshold) path += `M${(120 + x - size / 2).toFixed(2)},${(120 + y - size / 2).toFixed(2)}h${size}v${size}h-${size}Z`
  }
  return path
}

/** The illuminated part of an orthographically projected sphere, lit from screen-right. */
export function illuminatedPath(radius: number, cosine: number) {
  const c = Math.max(-1, Math.min(1, cosine))
  if (c <= -.99999) return ''
  if (c >= .99999) return `M120,${120 - radius}a${radius},${radius} 0 1,1 0,${radius * 2}a${radius},${radius} 0 1,1 0,-${radius * 2}Z`
  return `M120,${120 - radius}A${radius},${radius} 0 0,1 120,${120 + radius}A${Math.max(.001, Math.abs(c) * radius)},${radius} 0 0,${c >= 0 ? 1 : 0} 120,${120 - radius}Z`
}

export const noise = (lon: number, lat: number) => Math.sin(lon * .31 + Math.sin(lat * .19) * 2) * Math.sin(lat * .43 - lon * .11)
export function spot(lon: number, lat: number, x: number, y: number, rx: number, ry: number) {
  const dx = ((lon - x + 540) % 360) - 180
  return (dx / rx) ** 2 + ((lat - y) / ry) ** 2
}

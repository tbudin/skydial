import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { gzipSync } from 'node:zlib'

const root = resolve(import.meta.dirname, '..', 'dist-lib')
const seen = new Set()
let bytes = 0
let compressed = 0
function visit(path) {
  if (seen.has(path)) return
  seen.add(path)
  const code = readFileSync(path, 'utf8')
  bytes += Buffer.byteLength(code)
  compressed += gzipSync(code).byteLength
  for (const [, specifier] of code.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)) {
    assert(!/^(three|three-stdlib|@react-three\/)/.test(specifier), `Renderer leaked into LCD: ${specifier}`)
    if (specifier.startsWith('.')) visit(resolve(dirname(path), specifier))
  }
}
visit(resolve(root, 'lcd.js'))
assert(compressed < 65000, `LCD source graph exceeded its 65 kB gzip budget: ${compressed}`)
const assets = resolve(import.meta.dirname, '..', 'dist-lcd-consumer', 'assets')
assert(!readdirSync(assets).some((file) => /\.(jpg|png|webp)$/i.test(file)), 'LCD consumer copied bitmap textures')
console.info(`LCD verified: no Three/Fiber/Drei imports or texture assets; ${seen.size} JS modules, ${bytes} bytes source, ${compressed} bytes gzip (external React and Astronomy Engine excluded).`)

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../site-dist', import.meta.url))
const base = '/skydial/'
const host = process.env.SKYDIAL_HOST || '127.0.0.1'
const port = Number(process.env.SKYDIAL_PORT || 4323)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new RangeError('Invalid SKYDIAL_PORT')
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.md': 'text/markdown' }
createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost')
  if (url.pathname === '/') { response.writeHead(302, { location: base }).end(); return }
  const relative = decodeURIComponent(url.pathname.startsWith(base) ? url.pathname.slice(base.length) : url.pathname.slice(1))
  let path = resolve(root, relative)
  if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403).end(); return }
  try {
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html')
    response.writeHead(200, { 'content-type': mime[extname(path)] ?? 'application/octet-stream' })
    response.end(await readFile(path))
  } catch { response.writeHead(404).end('Not found') }
}).listen(port, host, () => console.info(`Preview: http://${host}:${port}${base}`))

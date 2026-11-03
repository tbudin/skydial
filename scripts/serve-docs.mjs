import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../site-dist', import.meta.url))
const base = '/skydial/'
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
}).listen(4323, '127.0.0.1', () => console.info('Local: http://127.0.0.1:4323/skydial/'))

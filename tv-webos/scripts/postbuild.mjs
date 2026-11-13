import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const htmlPath = join(dist, 'index.html')
let html = readFileSync(htmlPath, 'utf8')

// Bajo file:// crossorigin rompe la carga de scripts; nomodule sobra (solo hay bundle legacy).
html = html.replace(/\s+crossorigin(="[^"]*")?/g, '').replace(/\s+nomodule(="[^"]*")?/g, '')
// El bundle moderno ya no se emite (renderModernChunks:false), pero por si acaso:
html = html.replace(/<script type="module"[^>]*><\/script>\s*/g, '')
writeFileSync(htmlPath, html)

if (!existsSync(join(dist, 'appinfo.json'))) {
  console.error('dist/appinfo.json no existe')
  process.exit(1)
}
console.log('postbuild ok')

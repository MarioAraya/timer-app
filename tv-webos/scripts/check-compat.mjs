import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const assets = join(dist, 'assets')
const files = readdirSync(assets)
let bad = 0

const js = files.filter((f) => f.endsWith('.js')).map((f) => join('dist/assets', f))
if (js.length) {
  try {
    execSync(`npx es-check es5 ${js.map((f) => `"${f}"`).join(' ')}`, { cwd: root, stdio: 'inherit' })
  } catch {
    bad++
  }
}

// Vite+legacy (SystemJS) inyecta el CSS dentro del bundle JS; se escanea ahí y en .css sueltos.
const CSS_FORBIDDEN = ['var(--', 'display:grid', 'display: grid', 'backdrop-filter', 'inset:', 'aspect-ratio', 'clamp(']
for (const f of files.filter((n) => n.endsWith('.css') || n.startsWith('index-legacy'))) {
  const css = readFileSync(join(assets, f), 'utf8')
  for (const p of CSS_FORBIDDEN) {
    if (css.includes(p)) {
      console.error(`CSS prohibido "${p}" en ${f}`)
      bad++
    }
  }
}

const html = readFileSync(join(dist, 'index.html'), 'utf8')
if (/crossorigin/.test(html)) {
  console.error('index.html aún tiene crossorigin')
  bad++
}
// Regla §11.5: la app nunca carga scripts remotos en su propio contexto.
if (/<script[^>]*\ssrc="https?:/i.test(html)) {
  console.error('index.html carga un <script> externo (src="http...")')
  bad++
}

// Escaneo del código fuente (§11.5): patrón → únicos archivos donde se permite.
const RULES = [
  { name: 'localStorage', re: /localStorage/, allow: ['src/storage.js'] },
  { name: 'fetch(', re: /\bfetch\(/, allow: [] },
  { name: '.focus(', re: /\.focus\(/, allow: ['src/music/youtubeSource.js'] },
  { name: 'event.key/code', re: /\b(e|ev|event)\.(key|code)\b/, allow: [] },
  { name: 'youtube.com', re: /youtube\.com/, allow: ['src/music/ytProtocol.js'] },
]

function walk(dir) {
  let out = []
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) out = out.concat(walk(p))
    else if (/\.(js|jsx)$/.test(n) && !/\.test\.js$/.test(n)) out.push(p)
  }
  return out
}
for (const f of walk(join(root, 'src'))) {
  const rel = relative(root, f).split('\\').join('/')
  const text = readFileSync(f, 'utf8')
  for (const r of RULES) {
    if (r.re.test(text) && !r.allow.includes(rel)) {
      console.error(`Patrón prohibido "${r.name}" en ${rel}`)
      bad++
    }
  }
}

if (bad) process.exit(1)
console.log('check-compat ok')

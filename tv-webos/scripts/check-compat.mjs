import { execSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const assets = join(dist, 'assets')
const files = readdirSync(assets)
let bad = 0

const js = files.filter((f) => f.endsWith('.js')).map((f) => join('dist/assets', f))
if (js.length) {
  try {
    execSync(`npx es-check es5 ${js.map((f) => `"${f}"`).join(' ')}`, {
      cwd: join(dist, '..'),
      stdio: 'inherit',
    })
  } catch {
    bad++
  }
}

const CSS_FORBIDDEN = ['var(--', 'display:grid', 'display: grid', 'backdrop-filter', 'inset:', 'aspect-ratio', 'clamp(']
// Vite+legacy (SystemJS) inyecta el CSS dentro del bundle JS; se escanea ahí y en .css sueltos.
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
if (bad) process.exit(1)
console.log('check-compat ok')

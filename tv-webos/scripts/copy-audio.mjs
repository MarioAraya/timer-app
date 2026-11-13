import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const FILES = ['hiit_next-level_40-20_x12.mp3', 'tabata_rocky_20-10_x4.mp3', 'win_hof_4rounds.mp3']
const dest = join(root, 'public', 'audio')
mkdirSync(dest, { recursive: true })

for (const f of FILES) {
  const src = join(root, '..', 'public', f)
  const out = join(dest, f)
  if (!existsSync(src)) {
    console.error(`Falta ${f} en ../public (corre npm run audio:fetch en la raíz o copia el MP3)`)
    process.exit(1)
  }
  if (existsSync(out) && statSync(out).size === statSync(src).size) continue
  copyFileSync(src, out)
  console.log(`copiado ${f}`)
}

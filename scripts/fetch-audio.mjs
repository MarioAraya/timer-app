#!/usr/bin/env node
/**
 * Downloads every MP3 the app plays from Supabase into assets-audio/.
 *
 * Run once, and again whenever the playlist changes. The files are git-ignored
 * (they are ~100MB); assets-audio/ is the local cache that link-audio.mjs
 * copies into public/audio/ right before a Tauri build.
 *
 *   npm run audio:fetch
 */
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DEST = join(ROOT, 'assets-audio')

// Kept in sync with src/config/audioSource.js by hand: this script runs in plain
// node without the Vite pipeline, so it cannot import a module that pulls in
// browser-only code.
const SUPABASE_AUDIO =
  'https://zyfiugarcxtcyjnuopft.supabase.co/storage/v1/object/public/audio'

const FILES = [
  'hiit_next-level_40-20_x12.mp3',
  'tabata_rocky_20-10_x4.mp3',
  'lofi_morning_routine-chosic.com.mp3',
  'lofi_music_library-lofi-ambient-study-lofi-music-455378.mp3',
  'fassounds-lofi-study-calm-peaceful-chill-hop-112191.mp3',
  'fassounds-good-night-lofi-cozy-chill-music-160166.mp3',
  'lofidreams-cozy-lofi-background-music-for-study-457198.mp3',
  'mondamusic-lofi-lofi-girl-lofi-chill-512853.mp3',
  'pulsebox-lofi-melody-522894.mp3',
  'pulsebox-lofi-night-522890.mp3',
  'pulsebox-lofi-smooth-522876.mp3',
  'win_hof_4rounds-es.mp3',
  'win_hof_4rounds.mp3',
]

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

async function alreadyDownloaded(path) {
  try {
    const info = await stat(path)
    return info.size > 0
  } catch {
    return false
  }
}

async function download(filename) {
  const dest = join(DEST, filename)

  if (await alreadyDownloaded(dest)) {
    console.log(`  skip  ${filename} (already present)`)
    return { skipped: true, bytes: 0 }
  }

  const res = await fetch(`${SUPABASE_AUDIO}/${encodeURIComponent(filename)}`)
  if (!res.ok) {
    throw new Error(`${filename} → HTTP ${res.status} ${res.statusText}`)
  }

  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buf)
  console.log(`  ok    ${filename} (${mb(buf.length)})`)
  return { skipped: false, bytes: buf.length }
}

async function main() {
  await mkdir(DEST, { recursive: true })
  console.log(`Downloading ${FILES.length} tracks → assets-audio/\n`)

  let total = 0
  const failed = []

  for (const filename of FILES) {
    try {
      const { bytes } = await download(filename)
      total += bytes
    } catch (err) {
      console.error(`  FAIL  ${err.message}`)
      failed.push(filename)
    }
  }

  console.log(`\nDownloaded ${mb(total)}.`)

  if (failed.length) {
    console.error(`\n${failed.length} file(s) failed:`)
    failed.forEach((f) => console.error(`  - ${f}`))
    process.exit(1)
  }
}

main()

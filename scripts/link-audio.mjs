#!/usr/bin/env node
/**
 * Copies assets-audio/ into public/audio/ so Vite picks the MP3s up and Tauri
 * bundles them into the .app. Runs before a desktop build only — the web build
 * keeps streaming from Supabase, and public/audio/ is in .vercelignore.
 *
 * Fails loudly when a track is missing: a silent partial copy would produce an
 * .app that looks fine until the user is offline.
 *
 *   npm run audio:local
 */
import { mkdir, copyFile, readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'assets-audio')
const DEST = join(ROOT, 'public', 'audio')

const EXPECTED = 13

async function main() {
  let files
  try {
    files = (await readdir(SRC)).filter((f) => f.endsWith('.mp3'))
  } catch {
    console.error(
      `assets-audio/ not found.\nRun "npm run audio:fetch" first to download the tracks.`
    )
    process.exit(1)
  }

  if (files.length < EXPECTED) {
    console.error(
      `assets-audio/ has ${files.length} of ${EXPECTED} tracks.\n` +
        `Run "npm run audio:fetch" to download the missing ones — ` +
        `shipping a partial set makes the app fail only when offline.`
    )
    process.exit(1)
  }

  await mkdir(DEST, { recursive: true })

  let bytes = 0
  for (const file of files) {
    await copyFile(join(SRC, file), join(DEST, file))
    bytes += (await stat(join(SRC, file))).size
  }

  console.log(
    `Copied ${files.length} tracks (${(bytes / 1024 / 1024).toFixed(1)} MB) → public/audio/`
  )
}

main()

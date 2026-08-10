/**
 * Single point that decides where audio comes from.
 *
 * Web PWA  → Supabase storage (files are not in the repo, see public/AUDIO_FILES.md)
 * Tauri    → /audio/<file> bundled into the .app, so the desktop app works offline
 *
 * Nothing else in src/ should ever build an audio URL by hand.
 * See SPEC_MACOS.md §5.2.
 */
import { isTauri } from '../utils/tauri'

export const SUPABASE_AUDIO =
  'https://zyfiugarcxtcyjnuopft.supabase.co/storage/v1/object/public/audio'

/** Every track the app can play. `scripts/fetch-audio.mjs` mirrors this list. */
export const AUDIO_FILES = {
  workout: [
    'hiit_next-level_40-20_x12.mp3',
    'tabata_rocky_20-10_x4.mp3',
  ],
  lofi: [
    'lofi_morning_routine-chosic.com.mp3',
    'lofi_music_library-lofi-ambient-study-lofi-music-455378.mp3',
    'fassounds-lofi-study-calm-peaceful-chill-hop-112191.mp3',
    'fassounds-good-night-lofi-cozy-chill-music-160166.mp3',
    'lofidreams-cozy-lofi-background-music-for-study-457198.mp3',
    'mondamusic-lofi-lofi-girl-lofi-chill-512853.mp3',
    'pulsebox-lofi-melody-522894.mp3',
    'pulsebox-lofi-night-522890.mp3',
    'pulsebox-lofi-smooth-522876.mp3',
  ],
  breathing: [
    'win_hof_4rounds-es.mp3',
    'win_hof_4rounds.mp3',
  ],
}

/** Flat list of all 13 filenames, for the download script. */
export const ALL_AUDIO_FILES = [
  ...AUDIO_FILES.workout,
  ...AUDIO_FILES.lofi,
  ...AUDIO_FILES.breathing,
]

/**
 * Resolves a bare filename to a playable URL.
 * @param {string} filename e.g. 'pulsebox-lofi-night-522890.mp3'
 */
export function audioUrl(filename) {
  return isTauri() ? `/audio/${filename}` : `${SUPABASE_AUDIO}/${filename}`
}

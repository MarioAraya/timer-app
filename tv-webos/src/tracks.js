import { HIIT_CONFIG } from '../../src/config/hiitConfig.js'
import { TABATA_CONFIG } from '../../src/config/tabataConfig.js'

export const TRACKS = {
  hiit: {
    id: 'hiit',
    label: 'HIIT',
    summary: '12 rounds · 40 / 20',
    config: HIIT_CONFIG,
    audioSrc: 'audio/hiit_next-level_40-20_x12.mp3',
    startTime: 1.37, // = HIIT_AUDIO_CONFIG.startTime en src/utils/audioUtils.js
    colors: { work: '#1bd47f', rest: '#faa716', prep: '#2393f7' },
  },
  tabata: {
    id: 'tabata',
    label: 'TABATA',
    summary: '8 rounds · 20 / 10',
    config: TABATA_CONFIG,
    audioSrc: 'audio/tabata_rocky_20-10_x4.mp3',
    startTime: 0,
    colors: { work: '#ff6b35', rest: '#4ecdc4', prep: '#2393f7' },
  },
}

export const TRACK_ORDER = ['hiit', 'tabata']

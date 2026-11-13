import { formatClock } from './clock.js'

export const WIMHOF = {
  id: 'wimhof',
  label: 'WIM HOF',
  audioSrc: 'audio/win_hof_4rounds.mp3',
  startTime: 0,
  duration: 1080.05, // respaldo; en runtime manda audio.duration
}

var SEEK_STEP = 30

/** audio.duration puede ser NaN/Infinity/0 en Chromium 38 antes de la metadata. */
export function resolveTotal(audioDuration) {
  return isFinite(audioDuration) && audioDuration > 0 ? audioDuration : WIMHOF.duration
}

export function getWimHofState(audioTime, total) {
  var totalSec = Math.floor(total)
  var elapsedSec = Math.min(Math.floor(Math.max(0, audioTime)), totalSec)
  var leftSec = totalSec - elapsedSec
  var progress = Math.min(1, Math.max(0, audioTime / total))
  return {
    elapsedSec: elapsedSec,
    totalSec: totalSec,
    leftSec: leftSec,
    elapsedText: formatClock(elapsedSec),
    totalText: formatClock(totalSec),
    leftText: formatClock(leftSec),
    progress: progress,
    done: audioTime >= total,
  }
}

/** dir = -1 | +1. Salto de 30 s. Devuelve audio.currentTime o null. */
export function getWimHofSeek(audioTime, total, dir) {
  if (dir < 0) return Math.max(0, audioTime - SEEK_STEP)
  if (audioTime >= total - 1) return null
  return Math.min(audioTime + SEEK_STEP, total - 1)
}

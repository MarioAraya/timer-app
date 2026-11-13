import { getStateFromElapsed, getTotalDuration } from '../../src/utils/ticksEngine.js'

const SEEK_BACK_THRESHOLD = 3

/** 745.657 → '12:25'. Redondea hacia abajo. */
export function formatClock(seconds) {
  var s = Math.max(0, Math.floor(seconds))
  var m = Math.floor(s / 60)
  var r = s % 60
  return m + ':' + (r < 10 ? '0' : '') + r
}

/** audio.currentTime donde empieza el WORK del round n (1-based). */
export function getRoundStartTime(track, round) {
  var cfg = track.config
  var t = track.startTime + cfg.preparation.duration
  for (var i = 0; i < round - 1; i++) t += cfg.rounds[i].work + cfg.rounds[i].rest
  return t
}

function nextOf(cfg, phase, round) {
  var r = cfg.rounds[round - 1]
  if (phase === 'prep') return { phase: 'work', duration: cfg.rounds[0].work }
  if (phase === 'work') {
    return r.rest > 0 ? { phase: 'rest', duration: r.rest } : null
  }
  if (round < cfg.rounds.length) return { phase: 'work', duration: cfg.rounds[round].work }
  return null
}

/** Estado completo para pintar la pantalla. audioTime = audio.currentTime. */
export function getTvState(track, audioTime) {
  var cfg = track.config
  var total = getTotalDuration(cfg)
  var elapsed = Math.max(0, audioTime - track.startTime)
  var totalRounds = cfg.rounds.length

  if (elapsed >= total) {
    return {
      phase: 'done', round: totalRounds, totalRounds: totalRounds,
      timeLeft: 0, secondsShown: 0, phaseDuration: 0,
      totalProgress: 1, totalLeft: 0, next: null,
    }
  }

  var s = getStateFromElapsed(cfg, elapsed)
  var phase = s.isPreparationPhase ? 'prep' : s.isWorkPhase ? 'work' : 'rest'
  var r = cfg.rounds[s.currentRound - 1]
  var phaseDuration = phase === 'prep' ? cfg.preparation.duration : phase === 'work' ? r.work : r.rest

  return {
    phase: phase,
    round: s.currentRound,
    totalRounds: totalRounds,
    timeLeft: s.timeLeft,
    secondsShown: Math.ceil(s.timeLeft),
    phaseDuration: phaseDuration,
    totalProgress: elapsed / total,
    totalLeft: total - elapsed,
    next: nextOf(cfg, phase, s.currentRound),
  }
}

/** Destino de ←/→ (dir = -1 | +1). Devuelve audio.currentTime, o null si no hay salto. */
export function getSeekTarget(track, audioTime, dir) {
  var st = getTvState(track, audioTime)
  if (dir > 0) {
    if (st.phase === 'done') return null
    if (st.phase === 'prep') return getRoundStartTime(track, 1)
    if (st.round >= st.totalRounds) return null
    return getRoundStartTime(track, st.round + 1)
  }
  if (st.phase === 'prep' || st.phase === 'done') return track.startTime
  var start = getRoundStartTime(track, st.round)
  if (audioTime - start > SEEK_BACK_THRESHOLD) return start
  if (st.round === 1) return track.startTime
  return getRoundStartTime(track, st.round - 1)
}

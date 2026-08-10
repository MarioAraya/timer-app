// Total workout duration derived from the setup sliders.
// The configs (hiitConfig / tabataConfig) expose per-round durations calibrated
// to the MP3, but the setup modal applies one work and one rest value to every
// round — so the preview total is rounds × (work + rest), plus the intro.

export function computeTotalSeconds({ prep = 0, rounds = 0, work = 0, rest = 0 }) {
  const safe = (n) => (Number.isFinite(n) && n > 0 ? n : 0)
  return safe(prep) + safe(rounds) * (safe(work) + safe(rest))
}

export function formatTotal(totalSeconds) {
  const secs = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.round(totalSeconds) : 0
  const mins = Math.floor(secs / 60)
  return `${mins}:${(secs % 60).toString().padStart(2, '0')}`
}

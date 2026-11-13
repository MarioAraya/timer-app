import { TRACKS } from '../tracks.js'
import { getTotalDuration } from '../../../src/utils/ticksEngine.js'
import { formatClock } from '../clock.js'
import { useRemote } from '../useRemote.js'

export function Done({ trackId, onRepeat, onHome }) {
  var t = TRACKS[trackId]
  useRemote(function (a) {
    if (a === 'ok') onRepeat()
    else if (a === 'back') onHome()
  })
  return (
    <div class="done">
      <div class="done-title" style={{ color: t.colors.work }}>¡LISTO!</div>
      <div class="done-sub">
        {t.label} · {t.config.rounds.length} rounds · {formatClock(getTotalDuration(t.config))}
      </div>
      <div class="done-hint">OK  Repetir  ·  BACK  Inicio</div>
    </div>
  )
}

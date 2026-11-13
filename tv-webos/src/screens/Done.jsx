import { useRemote } from '../useRemote.js'

export function Done({ color, sub, onRepeat, onHome }) {
  useRemote(function (a) {
    if (a === 'ok') onRepeat()
    else if (a === 'back') onHome()
  })
  return (
    <div class="done">
      <div class="done-title" style={{ color: color }}>¡LISTO!</div>
      <div class="done-sub">{sub}</div>
      <div class="done-hint">OK  Repetir  ·  BACK  Inicio</div>
    </div>
  )
}

import { useRemote } from '../useRemote.js'

// Provisional (W2): se reemplaza en W5.
export function WimHof({ onHome }) {
  useRemote(function (a) {
    if (a === 'back' || a === 'ok') onHome()
  })
  return (
    <div class="done">
      <div class="done-title">WIM HOF</div>
      <div class="done-hint">BACK  Inicio</div>
    </div>
  )
}

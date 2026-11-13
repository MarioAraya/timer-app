import { useState } from 'preact/hooks'
import { TRACKS, TRACK_ORDER } from '../tracks.js'
import { getTotalDuration } from '../../../src/utils/ticksEngine.js'
import { formatClock } from '../clock.js'
import { useRemote } from '../useRemote.js'

export function Home({ onStart, onExit }) {
  var [focus, setFocus] = useState(0)

  useRemote(function (a) {
    if (a === 'left') setFocus(Math.max(0, focus - 1))
    else if (a === 'right') setFocus(Math.min(TRACK_ORDER.length - 1, focus + 1))
    else if (a === 'ok') onStart(TRACK_ORDER[focus])
    else if (a === 'back') onExit()
  })

  return (
    <div class="home">
      <div class="home-title">TIMER</div>
      <div class="home-cards">
        {TRACK_ORDER.map(function (id, i) {
          var t = TRACKS[id]
          var cls = 'card' + (i === focus ? ' is-focused' : '')
          return (
            <div key={id} class={cls} style={i === focus ? { borderLeftColor: t.colors.work, background: t.colors.work } : { borderLeftColor: t.colors.work }}
                 onClick={function () { setFocus(i); onStart(id) }}>
              <div class="card-name">{t.label}</div>
              <div class="card-summary">{t.summary}</div>
              <div class="card-duration">{formatClock(getTotalDuration(t.config))}</div>
            </div>
          )
        })}
      </div>
      <div class="home-hint">OK  Empezar</div>
    </div>
  )
}

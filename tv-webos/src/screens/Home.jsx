import { useState } from 'preact/hooks'
import { ACTIVITIES, ACTIVITY_ORDER } from '../activities.js'
import { moveFocus } from '../homeNav.js'
import { useRemote } from '../useRemote.js'

var COLS = 2

export function Home({ onStart, onExit }) {
  var [focus, setFocus] = useState(0)

  useRemote(function (a) {
    if (a === 'left' || a === 'right' || a === 'up' || a === 'down') {
      setFocus(moveFocus(focus, a, ACTIVITY_ORDER.length, COLS))
    } else if (a === 'ok') onStart(ACTIVITY_ORDER[focus])
    else if (a === 'back') onExit()
  })

  var rows = []
  for (var i = 0; i < ACTIVITY_ORDER.length; i += COLS) {
    rows.push(ACTIVITY_ORDER.slice(i, i + COLS))
  }

  return (
    <div class="home">
      <div class="home-title">TIMER</div>
      <div class="home-rows">
        {rows.map(function (row, r) {
          return (
            <div key={r} class="home-row">
              {row.map(function (id, c) {
                var idx = r * COLS + c
                var a = ACTIVITIES[id]
                var focused = idx === focus
                var style = focused
                  ? { borderLeftColor: a.color, background: a.color }
                  : { borderLeftColor: a.color }
                return (
                  <div key={id} class={'card' + (focused ? ' is-focused' : '')} style={style}
                       onClick={function () { setFocus(idx); onStart(id) }}>
                    <div class="card-name">{a.label}</div>
                    <div class="card-summary">{a.summary}</div>
                    <div class="card-duration">{a.getDurationText()}</div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <div class="home-hint">OK  Empezar</div>
    </div>
  )
}

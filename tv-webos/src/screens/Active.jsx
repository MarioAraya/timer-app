import { useEffect, useMemo, useState } from 'preact/hooks'
import { TRACKS } from '../tracks.js'
import { createPlayer } from '../player.js'
import { useClock } from '../useClock.js'
import { useRemote } from '../useRemote.js'
import { getSeekTarget, formatClock } from '../clock.js'
import { BigDigits } from '../components/BigDigits.jsx'
import { ProgressBar } from '../components/ProgressBar.jsx'
import { DebugOverlay } from '../components/DebugOverlay.jsx'

var LABEL = { prep: 'PREPÁRATE', work: 'TRABAJO', rest: 'DESCANSO' }
var NEXT = { work: 'TRABAJO', rest: 'DESCANSO' }

export function Active({ trackId, onDone, onHome }) {
  var track = TRACKS[trackId]
  var [paused, setPaused] = useState(false)
  var [error, setError] = useState(false)
  var [debug, setDebug] = useState(false)

  var player = useMemo(function () {
    return createPlayer(track, {
      onEnded: function () { onDone() },
      onError: function () { setError(true) },
    })
  }, [track])

  useEffect(function () {
    player.play()
    return function () { player.destroy() }
  }, [player])

  var st = useClock(track, player)

  useEffect(function () {
    if (st.phase === 'done') onDone()
  }, [st.phase])

  useRemote(function (a) {
    if (a === 'debug') { setDebug(!debug); return }
    if (error) { if (a === 'back' || a === 'ok') onHome(); return }
    if (a === 'ok' || a === 'playPause') {
      player.toggle(); setPaused(!player.isPlaying())
    } else if (a === 'back') {
      if (!paused) { player.pause(); setPaused(true) } else onHome()
    } else if (a === 'stop') {
      onHome()
    } else if (a === 'left' || a === 'right') {
      var target = getSeekTarget(track, player.getTime(), a === 'right' ? 1 : -1)
      if (target !== null) player.seek(target)
    }
  })

  var phase = st.phase === 'done' ? 'rest' : st.phase
  var final = (st.phase === 'work' || st.phase === 'rest') && st.secondsShown <= 3 && st.secondsShown > 0
  var nextText = st.next ? NEXT[st.next.phase] + ' ' + Math.round(st.next.duration) + 's' : 'FIN'

  return (
    <div class={'active phase-' + phase + ' theme-' + trackId}>
      <div class="bg bg-prep" style={{ opacity: phase === 'prep' ? 1 : 0 }} />
      <div class="bg bg-work" style={{ opacity: phase === 'work' ? 1 : 0 }} />
      <div class="bg bg-rest" style={{ opacity: phase === 'rest' ? 1 : 0 }} />
      <div class="active-top">
        <div class="phase-label">{LABEL[phase]}</div>
        <div class="round-label">
          {phase === 'prep' ? track.label : 'ROUND ' + st.round + ' / ' + st.totalRounds}
        </div>
      </div>
      <div class={'active-center' + (final ? ' is-final' : '')}>
        <BigDigits value={st.secondsShown} />
      </div>
      <div class="active-bottom">
        <div class="bottom-row">
          <div class="next-label">Sigue: {nextText}</div>
          <div class="total-left">{formatClock(st.totalLeft)}</div>
        </div>
        <ProgressBar progress={st.totalProgress} />
      </div>
      {(paused || error) && (
        <div class="overlay">
          <div class="overlay-title">{error ? 'No se pudo cargar el audio' : 'PAUSA'}</div>
          <div class="overlay-hint">
            {error ? 'BACK  Volver' : 'OK  Seguir  ·  ◀ ▶  Round  ·  BACK  Salir'}
          </div>
        </div>
      )}
      {debug && <DebugOverlay player={player} />}
    </div>
  )
}

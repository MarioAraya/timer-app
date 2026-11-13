import { useEffect, useMemo, useState } from 'preact/hooks'
import { WIMHOF, getWimHofSeek, resolveTotal } from '../wimhof.js'
import { createPlayer } from '../player.js'
import { useWimHofClock } from '../useWimHofClock.js'
import { useRemote } from '../useRemote.js'
import { BigClock } from '../components/BigClock.jsx'
import { ProgressBar } from '../components/ProgressBar.jsx'
import { DebugOverlay } from '../components/DebugOverlay.jsx'

export function WimHof({ onDone, onHome }) {
  var [paused, setPaused] = useState(false)
  var [error, setError] = useState(false)
  var [debug, setDebug] = useState(false)

  var player = useMemo(function () {
    return createPlayer(WIMHOF, {
      onEnded: function () { onDone() },
      onError: function () { setError(true) },
    })
  }, [])

  useEffect(function () {
    player.play()
    return function () { player.destroy() }
  }, [player])

  var st = useWimHofClock(player)

  useEffect(function () {
    if (st.done) onDone()
  }, [st.done])

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
      var target = getWimHofSeek(player.getTime(), resolveTotal(player.getDuration()), a === 'right' ? 1 : -1)
      if (target !== null) player.seek(target)
    }
  })

  return (
    <div class="wimhof">
      <div class="wimhof-top">
        <div class="wimhof-title">WIM HOF</div>
        <div class="wimhof-tag">GUIADO · INGLÉS</div>
      </div>
      <div class="wimhof-center">
        <BigClock text={st.elapsedText} />
        <div class="wimhof-of">de {st.totalText}</div>
      </div>
      <div class="wimhof-bottom">
        <div class="bottom-row">
          <div class="next-label">Restan {st.leftText}</div>
          <div class="wimhof-seek">◀ ▶  30 s</div>
        </div>
        <ProgressBar progress={st.progress} />
        <div class="wimhof-note">Sentado o acostado. Nunca en el agua ni manejando.</div>
      </div>
      {(paused || error) && (
        <div class="overlay">
          <div class="overlay-title">{error ? 'No se pudo cargar el audio' : 'PAUSA'}</div>
          <div class="overlay-hint">
            {error ? 'BACK  Volver' : 'OK  Seguir  ·  ◀ ▶  30 s  ·  BACK  Salir'}
          </div>
        </div>
      )}
      {debug && <DebugOverlay player={player} />}
    </div>
  )
}

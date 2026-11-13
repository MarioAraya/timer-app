import { useEffect, useState } from 'preact/hooks'
import { getTvState } from './clock.js'

export function useClock(track, player) {
  var [state, setState] = useState(function () { return getTvState(track, track.startTime) })

  useEffect(function () {
    var raf
    var last = null
    function tick() {
      var s = getTvState(track, player.getTime())
      if (!last || last.phase !== s.phase || last.round !== s.round || last.secondsShown !== s.secondsShown) {
        last = s
        setState(s)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return function () { cancelAnimationFrame(raf) }
  }, [track, player])

  return state
}

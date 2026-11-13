import { useEffect, useState } from 'preact/hooks'
import { getWimHofState, resolveTotal } from './wimhof.js'

export function useWimHofClock(player) {
  var [state, setState] = useState(function () { return getWimHofState(0, resolveTotal(NaN)) })

  useEffect(function () {
    var raf
    var last = null
    function tick() {
      var s = getWimHofState(player.getTime(), resolveTotal(player.getDuration()))
      if (!last || last.elapsedSec !== s.elapsedSec || last.totalSec !== s.totalSec || last.done !== s.done) {
        last = s
        setState(s)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return function () { cancelAnimationFrame(raf) }
  }, [player])

  return state
}

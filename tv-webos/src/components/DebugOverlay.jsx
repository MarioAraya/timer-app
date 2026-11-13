import { useEffect, useState } from 'preact/hooks'

var errors = []
window.onerror = function (msg) { errors.push(String(msg)); return false }

export function DebugOverlay({ player }) {
  var [info, setInfo] = useState({})

  useEffect(function () {
    var lastRaw = -1, lastT = performance.now()
    var gaps = []
    var frames = 0, fpsStart = performance.now(), fps = 0
    var id = setInterval(function () {
      var now = performance.now()
      var raw = player ? player.getRaw() : 0
      if (raw !== lastRaw) {
        gaps.push(now - lastT)
        if (gaps.length > 50) gaps.shift()
        lastRaw = raw; lastT = now
      }
      frames++
      if (now - fpsStart >= 1000) { fps = frames; frames = 0; fpsStart = now }
      setInfo({
        raw: raw,
        min: gaps.length ? Math.round(Math.min.apply(null, gaps)) : 0,
        max: gaps.length ? Math.round(Math.max.apply(null, gaps)) : 0,
      })
    }, 100)
    return function () { clearInterval(id) }
  }, [player])

  return (
    <div class="debug-overlay">
      <div>{navigator.userAgent}</div>
      <div>currentTime: {info.raw !== undefined ? Number(info.raw).toFixed(3) : '-'}</div>
      <div>gap ms min/max: {info.min}/{info.max}</div>
      <div>keyCode: {String(window.__lastKey)}</div>
      <div>err: {errors.length ? errors[errors.length - 1] : '-'}</div>
    </div>
  )
}

import { useEffect, useRef } from 'preact/hooks'
import { actionForKey } from './remote.js'

export function useRemote(handler) {
  var ref = useRef(handler)
  ref.current = handler
  useEffect(function () {
    function onKey(e) {
      var a = actionForKey(e.keyCode)
      window.__lastKey = e.keyCode
      if (a) {
        e.preventDefault()
        ref.current(a)
      }
    }
    window.addEventListener('keydown', onKey)
    return function () { window.removeEventListener('keydown', onKey) }
  }, [])
}

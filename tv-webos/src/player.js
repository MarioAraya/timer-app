var MAX_INTERP = 0.5

function safePlay(audio) {
  var p = audio.play()
  if (p && p.catch) p.catch(function () {})
}

export function createPlayer(track, hooks) {
  hooks = hooks || {}
  var audio = new Audio()
  audio.preload = 'auto'
  var ready = false
  var wantPlay = false
  var lastRaw = -1
  var lastStamp = 0

  function onMeta() {
    ready = true
    try { audio.currentTime = track.startTime } catch (e) {}
    if (wantPlay) safePlay(audio)
  }
  function onEnded() { if (hooks.onEnded) hooks.onEnded() }
  function onError() { if (hooks.onError) hooks.onError() }

  audio.addEventListener('loadedmetadata', onMeta)
  audio.addEventListener('ended', onEnded)
  audio.addEventListener('error', onError)
  audio.src = track.audioSrc
  audio.load()

  return {
    play: function () {
      wantPlay = true
      if (ready) safePlay(audio)
    },
    pause: function () {
      wantPlay = false
      audio.pause()
    },
    toggle: function () {
      if (wantPlay) this.pause(); else this.play()
    },
    seek: function (s) {
      try { audio.currentTime = s } catch (e) {}
      lastRaw = -1
    },
    getTime: function () {
      var raw = audio.currentTime
      var now = performance.now()
      if (raw !== lastRaw) {
        lastRaw = raw
        lastStamp = now
        return raw
      }
      if (wantPlay && !audio.paused) {
        return raw + Math.min((now - lastStamp) / 1000, MAX_INTERP)
      }
      return raw
    },
    getRaw: function () { return audio.currentTime },
    isPlaying: function () { return wantPlay },
    destroy: function () {
      wantPlay = false
      audio.pause()
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      audio.src = ''
    },
  }
}

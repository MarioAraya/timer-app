var MAP = {
  37: 'left', 39: 'right', 38: 'up', 40: 'down',
  13: 'ok',
  461: 'back', 8: 'back', 27: 'back',
  415: 'playPause', 19: 'playPause', 32: 'playPause',
  413: 'stop',
  406: 'debug', 68: 'debug',
}

export function actionForKey(keyCode) {
  return MAP.hasOwnProperty(keyCode) ? MAP[keyCode] : null
}

import { TRACKS } from './tracks.js'
import { WIMHOF } from './wimhof.js'
import { getTotalDuration } from '../../src/utils/ticksEngine.js'
import { formatClock } from './clock.js'

function workout(id) {
  var t = TRACKS[id]
  var dur = function () { return formatClock(getTotalDuration(t.config)) }
  return {
    id: id,
    kind: 'workout',
    label: t.label,
    summary: t.summary,
    color: t.colors.work,
    getDurationText: dur,
    doneSub: t.label + ' · ' + t.config.rounds.length + ' rounds · ' + dur(),
  }
}

// kind decide a qué pantalla va App.jsx al dar OK en Home.
export var ACTIVITIES = {
  hiit: workout('hiit'),
  tabata: workout('tabata'),
  wimhof: {
    id: 'wimhof',
    kind: 'wimhof',
    label: WIMHOF.label,
    summary: '4 rondas · guiado en inglés',
    color: '#56c8d8',
    getDurationText: function () { return formatClock(WIMHOF.duration) },
    doneSub: 'WIM HOF · 4 rondas · ' + formatClock(WIMHOF.duration),
  },
}

export var ACTIVITY_ORDER = ['hiit', 'tabata', 'wimhof']

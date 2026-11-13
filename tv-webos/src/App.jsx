import { useState } from 'preact/hooks'
import { Home } from './screens/Home.jsx'
import { Active } from './screens/Active.jsx'
import { WimHof } from './screens/WimHof.jsx'
import { Done } from './screens/Done.jsx'
import { ACTIVITIES } from './activities.js'

var SCREEN_BY_KIND = { workout: 'active', wimhof: 'wimhof' }

export function App() {
  var [s, setS] = useState({ screen: 'home', activityId: 'hiit', run: 0 })

  function go(screen, activityId, runInc) {
    setS({ screen: screen, activityId: activityId, run: s.run + (runInc ? 1 : 0) })
  }
  function exit() { try { window.close() } catch (e) {} }

  var act = ACTIVITIES[s.activityId]

  if (s.screen === 'active') {
    return <Active key={s.run} trackId={s.activityId}
      onDone={function () { go('done', s.activityId, false) }}
      onHome={function () { go('home', s.activityId, false) }} />
  }
  if (s.screen === 'wimhof') {
    return <WimHof key={s.run}
      onDone={function () { go('done', s.activityId, false) }}
      onHome={function () { go('home', s.activityId, false) }} />
  }
  if (s.screen === 'done') {
    return <Done color={act.color} sub={act.doneSub}
      onRepeat={function () { go(SCREEN_BY_KIND[act.kind], s.activityId, true) }}
      onHome={function () { go('home', s.activityId, false) }} />
  }
  return <Home onExit={exit}
    onStart={function (id) { go(SCREEN_BY_KIND[ACTIVITIES[id].kind], id, true) }} />
}

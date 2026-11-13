import { useState } from 'preact/hooks'
import { Home } from './screens/Home.jsx'
import { Active } from './screens/Active.jsx'
import { Done } from './screens/Done.jsx'

export function App() {
  var [s, setS] = useState({ screen: 'home', trackId: 'hiit', run: 0 })

  function exit() { try { window.close() } catch (e) {} }

  if (s.screen === 'active') {
    return <Active key={s.run} trackId={s.trackId}
      onDone={function () { setS({ screen: 'done', trackId: s.trackId, run: s.run }) }}
      onHome={function () { setS({ screen: 'home', trackId: s.trackId, run: s.run }) }} />
  }
  if (s.screen === 'done') {
    return <Done trackId={s.trackId}
      onRepeat={function () { setS({ screen: 'active', trackId: s.trackId, run: s.run + 1 }) }}
      onHome={function () { setS({ screen: 'home', trackId: s.trackId, run: s.run }) }} />
  }
  return <Home onExit={exit}
    onStart={function (id) { setS({ screen: 'active', trackId: id, run: s.run + 1 }) }} />
}

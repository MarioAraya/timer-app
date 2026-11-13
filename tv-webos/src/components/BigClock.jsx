export function BigClock({ text }) {
  var chars = String(text).split('')
  return (
    <div class="big-clock">
      {chars.map(function (ch, i) {
        return <span key={i} class={ch === ':' ? 'colon' : 'digit'}>{ch}</span>
      })}
    </div>
  )
}

export function BigDigits({ value }) {
  var str = String(Math.max(0, value))
  var digits = str.split('')
  return (
    <div class="big-digits">
      {digits.map(function (d, i) {
        return <span key={i} class="digit">{d}</span>
      })}
    </div>
  )
}

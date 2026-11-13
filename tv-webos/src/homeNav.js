/** action: 'left'|'right'|'up'|'down'. Sin wrap. Si el destino no existe, devuelve index. */
export function moveFocus(index, action, count, cols) {
  var next = index
  if (action === 'left') {
    if (index % cols !== 0) next = index - 1
  } else if (action === 'right') {
    if (index % cols !== cols - 1 && index + 1 < count) next = index + 1
  } else if (action === 'up') {
    if (index - cols >= 0) next = index - cols
  } else if (action === 'down') {
    if (index + cols < count) next = index + cols
  }
  return next
}

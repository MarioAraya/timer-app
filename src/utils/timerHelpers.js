// Formatear tiempo en MM:SS
export const formatTime = (seconds) => {
  const intSeconds = Math.floor(seconds)
  const minutes = Math.floor(intSeconds / 60)
  const remainingSeconds = intSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Formatear tiempo solo en segundos (para timers cortos)
export const formatTimeSeconds = (seconds) => {
  return Math.floor(seconds).toString().padStart(2, '0')
}

// Calcular porcentaje de progreso
export const calculateProgress = (current, total) => {
  return (current / total) * 100
}

// Verificar si un clic es en un botón (para evitar conflictos)
export const isClickOnButton = (event) => {
  return event.target.closest('button')
}
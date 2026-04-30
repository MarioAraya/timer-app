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

export function getTotalWorkoutSeconds(config) {
  const prepTime = config.preparation.duration
  const roundsTime = config.rounds.reduce((total, round) => total + round.work + round.rest, 0)
  return prepTime + roundsTime
}

export function calculateElapsedTime({ config, preparationTime, currentRound, timeLeft, isWorkPhase, isPreparationPhase }) {
  let elapsed = 0

  if (isPreparationPhase) {
    elapsed = preparationTime - timeLeft
  } else {
    elapsed = preparationTime

    for (let i = 0; i < currentRound - 1; i++) {
      elapsed += config.rounds[i].work + config.rounds[i].rest
    }

    const currentRoundConfig = config.rounds[currentRound - 1]
    if (currentRoundConfig) {
      if (isWorkPhase) {
        elapsed += currentRoundConfig.work - timeLeft
      } else {
        elapsed += currentRoundConfig.work + (currentRoundConfig.rest - timeLeft)
      }
    }
  }

  return Math.max(0, elapsed)
}

export function calculateTotalProgress({ config, preparationTime, currentRound, timeLeft, isWorkPhase, isPreparationPhase, isFinished }) {
  if (isFinished) return 100
  const totalSeconds = getTotalWorkoutSeconds(config)
  const elapsed = calculateElapsedTime({ config, preparationTime, currentRound, timeLeft, isWorkPhase, isPreparationPhase })
  return Math.min(100, (elapsed / totalSeconds) * 100)
}
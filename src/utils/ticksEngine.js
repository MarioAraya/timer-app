/**
 * Ticks Engine
 *
 * Converts absolute MP3 timestamps (ticks) into round configurations.
 * Each tick marks the beginning of a phase (work or rest) in the MP3 track.
 * Durations are derived automatically from the difference between consecutive ticks.
 *
 * Tick format:
 *   { time: number, phase: 'prep'|'work'|'rest'|'end', round?: number, subtitle?: string }
 */

/**
 * Build rounds config from an array of ticks (absolute MP3 timestamps).
 *
 * @param {Array<{time: number, phase: string, round?: number, subtitle?: string}>} ticks
 * @returns {{ preparation: { duration: number, subtitle: string }, rounds: Array }}
 */
export function buildConfigFromTicks(ticks) {
  if (!ticks || ticks.length < 3) {
    throw new Error('Need at least 3 ticks: prep start, first work, and end')
  }

  // Sort by time
  const sorted = [...ticks].sort((a, b) => a.time - b.time)

  // First tick must be prep or the implicit 0
  const prepTick = sorted[0]
  if (prepTick.phase !== 'prep') {
    throw new Error('First tick must be phase "prep"')
  }

  // Find the first work tick to get preparation duration
  const firstWorkIdx = sorted.findIndex(t => t.phase === 'work')
  if (firstWorkIdx < 0) {
    throw new Error('No work tick found')
  }

  const preparation = {
    duration: sorted[firstWorkIdx].time - prepTick.time,
    subtitle: prepTick.subtitle || 'Get ready!'
  }

  // Build rounds from work/rest/work/rest... pattern
  const rounds = []
  let currentRound = null

  for (let i = firstWorkIdx; i < sorted.length; i++) {
    const tick = sorted[i]
    const nextTick = sorted[i + 1]

    if (tick.phase === 'work') {
      currentRound = {
        workStart: tick.time,
        work: 0,
        rest: 0,
        workSubtitle: tick.subtitle || `Round ${tick.round || rounds.length + 1}!`,
        restSubtitle: ''
      }

      if (nextTick) {
        currentRound.work = nextTick.time - tick.time
      }
    } else if (tick.phase === 'rest') {
      if (currentRound) {
        currentRound.restSubtitle = tick.subtitle || 'Breathe and recover'

        if (nextTick) {
          currentRound.rest = nextTick.time - tick.time
        } else {
          // Last tick is rest with no end - use 0
          currentRound.rest = 0
        }

        rounds.push({
          work: Math.round(currentRound.work * 100) / 100,
          rest: Math.round(currentRound.rest * 100) / 100,
          workSubtitle: currentRound.workSubtitle,
          restSubtitle: currentRound.restSubtitle,
          workStart: Math.round(currentRound.workStart * 1000) / 1000
        })
        currentRound = null
      }
    } else if (tick.phase === 'end') {
      // End marker - finalize current round if in rest
      if (currentRound) {
        // If we're still in a work phase (no rest for this round)
        currentRound.rest = 0
        currentRound.restSubtitle = tick.subtitle || ''
        rounds.push({
          work: Math.round(currentRound.work * 100) / 100,
          rest: 0,
          workSubtitle: currentRound.workSubtitle,
          restSubtitle: currentRound.restSubtitle,
          workStart: Math.round(currentRound.workStart * 1000) / 1000
        })
        currentRound = null
      }
      break
    }
  }

  return { preparation, rounds }
}

/**
 * Calculate the expected audio position for a given timer state.
 * This is the inverse: given round/phase/timeLeft, what should audio.currentTime be?
 *
 * @param {Object} params
 * @param {Object} params.config - The config with preparation and rounds
 * @param {number} params.currentRound - 1-based round number
 * @param {boolean} params.isWorkPhase
 * @param {boolean} params.isPreparationPhase
 * @param {number} params.timeLeft - seconds remaining in current phase
 * @param {number} [params.audioStartOffset=0] - MP3 start time offset
 * @returns {number} expected audio currentTime in seconds
 */
export function getExpectedAudioPosition({ config, currentRound, isWorkPhase, isPreparationPhase, timeLeft, audioStartOffset = 0 }) {
  let elapsed = audioStartOffset

  if (isPreparationPhase) {
    elapsed += config.preparation.duration - timeLeft
    return elapsed
  }

  // Full preparation
  elapsed += config.preparation.duration

  // Completed rounds
  for (let i = 0; i < currentRound - 1; i++) {
    elapsed += config.rounds[i].work + config.rounds[i].rest
  }

  // Current phase progress
  const roundConfig = config.rounds[currentRound - 1]
  if (isWorkPhase) {
    elapsed += roundConfig.work - timeLeft
  } else {
    elapsed += roundConfig.work + (roundConfig.rest - timeLeft)
  }

  return elapsed
}

/**
 * Given a total elapsed time, determine the timer state (round, phase, timeLeft).
 * Useful for seek operations.
 *
 * @param {Object} config - Config with preparation and rounds
 * @param {number} elapsedTime - Elapsed time from start of workout
 * @returns {{ currentRound: number, isWorkPhase: boolean, isPreparationPhase: boolean, timeLeft: number, subtitle: string }}
 */
export function getStateFromElapsed(config, elapsedTime) {
  // Preparation phase
  if (elapsedTime < config.preparation.duration) {
    return {
      currentRound: 1,
      isWorkPhase: true,
      isPreparationPhase: true,
      timeLeft: config.preparation.duration - elapsedTime,
      subtitle: config.preparation.subtitle
    }
  }

  let remaining = elapsedTime - config.preparation.duration

  for (let i = 0; i < config.rounds.length; i++) {
    const round = config.rounds[i]

    if (remaining < round.work) {
      return {
        currentRound: i + 1,
        isWorkPhase: true,
        isPreparationPhase: false,
        timeLeft: round.work - remaining,
        subtitle: round.workSubtitle
      }
    }
    remaining -= round.work

    if (round.rest > 0 && remaining < round.rest) {
      return {
        currentRound: i + 1,
        isWorkPhase: false,
        isPreparationPhase: false,
        timeLeft: round.rest - remaining,
        subtitle: round.restSubtitle
      }
    }
    remaining -= round.rest
  }

  // Past the end
  return {
    currentRound: config.rounds.length,
    isWorkPhase: false,
    isPreparationPhase: false,
    timeLeft: 0,
    subtitle: 'Complete!'
  }
}

/**
 * Get total workout duration from config.
 * @param {Object} config
 * @returns {number} total seconds
 */
export function getTotalDuration(config) {
  const prep = config.preparation.duration
  const rounds = config.rounds.reduce((sum, r) => sum + r.work + r.rest, 0)
  return prep + rounds
}

/**
 * Validate that config rounds match expected tick timestamps.
 * Returns an array of discrepancies (empty = all good).
 *
 * @param {Object} config - Config with preparation and rounds
 * @param {Array<{time: number, phase: string, round?: number}>} ticks - Reference ticks
 * @param {number} [tolerance=0.05] - Acceptable drift in seconds
 * @returns {Array<{tick: Object, expected: number, actual: number, drift: number}>}
 */
export function validateConfigAgainstTicks(config, ticks, tolerance = 0.05) {
  const discrepancies = []
  const sorted = [...ticks].sort((a, b) => a.time - b.time)

  let accumulatedTime = 0

  for (const tick of sorted) {
    if (tick.phase === 'prep') {
      // Prep starts at 0
      if (Math.abs(tick.time - accumulatedTime) > tolerance) {
        discrepancies.push({ tick, expected: accumulatedTime, actual: tick.time, drift: tick.time - accumulatedTime })
      }
      accumulatedTime = tick.time
      continue
    }

    if (tick.phase === 'work') {
      const roundIdx = (tick.round || 1) - 1
      let expectedTime

      if (roundIdx === 0) {
        expectedTime = sorted[0].time + config.preparation.duration
      } else {
        // Sum all previous phases
        expectedTime = sorted[0].time + config.preparation.duration
        for (let i = 0; i < roundIdx; i++) {
          expectedTime += config.rounds[i].work + config.rounds[i].rest
        }
      }

      const drift = Math.abs(tick.time - expectedTime)
      if (drift > tolerance) {
        discrepancies.push({ tick, expected: expectedTime, actual: tick.time, drift })
      }
    }

    if (tick.phase === 'rest') {
      const roundIdx = (tick.round || 1) - 1
      let expectedTime = sorted[0].time + config.preparation.duration

      for (let i = 0; i < roundIdx; i++) {
        expectedTime += config.rounds[i].work + config.rounds[i].rest
      }
      expectedTime += config.rounds[roundIdx].work

      const drift = Math.abs(tick.time - expectedTime)
      if (drift > tolerance) {
        discrepancies.push({ tick, expected: expectedTime, actual: tick.time, drift })
      }
    }
  }

  return discrepancies
}

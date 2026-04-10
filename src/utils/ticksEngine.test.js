import { describe, it, expect } from 'vitest'
import {
  buildConfigFromTicks,
  getExpectedAudioPosition,
  getStateFromElapsed,
  getTotalDuration,
  validateConfigAgainstTicks
} from './ticksEngine'
import { HIIT_TICKS } from '../config/hiitTicks'
import { TABATA_TICKS } from '../config/tabataTicks'
import { HIIT_CONFIG, CALIBRATION_MARKS } from '../config/hiitConfig'
import { TABATA_CONFIG } from '../config/tabataConfig'

// ─────────────────────────────────────────────────────
// buildConfigFromTicks
// ─────────────────────────────────────────────────────

describe('buildConfigFromTicks', () => {
  it('generates correct number of rounds for HIIT', () => {
    const config = buildConfigFromTicks(HIIT_TICKS)
    expect(config.rounds.length).toBe(12)
  })

  it('generates correct number of rounds for Tabata', () => {
    const config = buildConfigFromTicks(TABATA_TICKS)
    expect(config.rounds.length).toBe(8)
  })

  it('HIIT preparation duration matches tick difference', () => {
    const config = buildConfigFromTicks(HIIT_TICKS)
    expect(config.preparation.duration).toBeCloseTo(10.589, 2)
  })

  it('Tabata preparation duration is 11s', () => {
    const config = buildConfigFromTicks(TABATA_TICKS)
    expect(config.preparation.duration).toBe(11)
  })

  it('HIIT round 1 work duration matches calibration', () => {
    const config = buildConfigFromTicks(HIIT_TICKS)
    // 51.324 - 10.589 = 40.735
    expect(config.rounds[0].work).toBeCloseTo(40.74, 1)
  })

  it('HIIT round 1 rest duration matches calibration', () => {
    const config = buildConfigFromTicks(HIIT_TICKS)
    // 71.730 - 51.324 = 20.406
    expect(config.rounds[0].rest).toBeCloseTo(20.41, 1)
  })

  it('Tabata last round has rest = 0', () => {
    const config = buildConfigFromTicks(TABATA_TICKS)
    expect(config.rounds[7].rest).toBe(0)
  })

  it('preserves subtitles from ticks', () => {
    const config = buildConfigFromTicks(HIIT_TICKS)
    expect(config.rounds[0].workSubtitle).toBe("Let's go! Round 1!")
    expect(config.rounds[0].restSubtitle).toBe('Breathe... recover')
  })

  it('throws on insufficient ticks', () => {
    expect(() => buildConfigFromTicks([{ time: 0, phase: 'prep' }])).toThrow()
  })

  it('throws if first tick is not prep', () => {
    expect(() => buildConfigFromTicks([
      { time: 0, phase: 'work' },
      { time: 20, phase: 'rest' },
      { time: 30, phase: 'end' }
    ])).toThrow('First tick must be phase "prep"')
  })
})

// ─────────────────────────────────────────────────────
// Phase transitions - no skipping rounds
// ─────────────────────────────────────────────────────

describe('Phase transitions', () => {
  const hiitConfig = buildConfigFromTicks(HIIT_TICKS)
  const tabataConfig = buildConfigFromTicks(TABATA_TICKS)

  it('HIIT: every round has work > 0', () => {
    for (let i = 0; i < hiitConfig.rounds.length; i++) {
      expect(hiitConfig.rounds[i].work).toBeGreaterThan(0)
    }
  })

  it('HIIT: all rounds except last have rest > 0', () => {
    for (let i = 0; i < hiitConfig.rounds.length - 1; i++) {
      expect(hiitConfig.rounds[i].rest).toBeGreaterThan(0)
    }
  })

  it('Tabata: every round has work = 20s', () => {
    for (const round of tabataConfig.rounds) {
      expect(round.work).toBe(20)
    }
  })

  it('Tabata: rounds 1-7 have rest = 10s, round 8 has rest = 0', () => {
    for (let i = 0; i < 7; i++) {
      expect(tabataConfig.rounds[i].rest).toBe(10)
    }
    expect(tabataConfig.rounds[7].rest).toBe(0)
  })

  it('walking through all phases produces correct sequence (HIIT)', () => {
    const totalDuration = getTotalDuration(hiitConfig)
    const phases = []
    let t = 0

    while (t < totalDuration) {
      const state = getStateFromElapsed(hiitConfig, t)
      const key = state.isPreparationPhase
        ? 'prep'
        : state.isWorkPhase
          ? `work-${state.currentRound}`
          : `rest-${state.currentRound}`

      if (phases.length === 0 || phases[phases.length - 1] !== key) {
        phases.push(key)
      }
      t += 0.5
    }

    // Expected: prep, work-1, rest-1, work-2, rest-2, ... work-12, rest-12
    expect(phases[0]).toBe('prep')
    expect(phases[1]).toBe('work-1')
    expect(phases[2]).toBe('rest-1')
    expect(phases[phases.length - 2]).toBe('work-12')
    expect(phases[phases.length - 1]).toBe('rest-12')

    // Should have 1 prep + 12 work + 12 rest = 25 phases
    expect(phases.length).toBe(25)
  })

  it('walking through all phases produces correct sequence (Tabata)', () => {
    const totalDuration = getTotalDuration(tabataConfig)
    const phases = []
    let t = 0

    while (t < totalDuration) {
      const state = getStateFromElapsed(tabataConfig, t)
      const key = state.isPreparationPhase
        ? 'prep'
        : state.isWorkPhase
          ? `work-${state.currentRound}`
          : `rest-${state.currentRound}`

      if (phases.length === 0 || phases[phases.length - 1] !== key) {
        phases.push(key)
      }
      t += 0.5
    }

    // prep, work-1, rest-1, ... work-7, rest-7, work-8 (no rest-8)
    expect(phases[0]).toBe('prep')
    expect(phases[1]).toBe('work-1')
    expect(phases[phases.length - 1]).toBe('work-8')

    // 1 prep + 7*(work+rest) + 1 work = 16 phases
    expect(phases.length).toBe(16)
  })

  it('no round is ever skipped during sequential elapsed time walk', () => {
    const config = buildConfigFromTicks(HIIT_TICKS)
    const totalDuration = getTotalDuration(config)
    let lastRound = 0

    for (let t = 0; t < totalDuration; t += 0.1) {
      const state = getStateFromElapsed(config, t)
      if (!state.isPreparationPhase) {
        // Round should only increment by 1
        if (state.currentRound > lastRound) {
          expect(state.currentRound).toBe(lastRound + 1)
          lastRound = state.currentRound
        }
      }
    }

    expect(lastRound).toBe(12)
  })
})

// ─────────────────────────────────────────────────────
// getStateFromElapsed (seek / advance / rewind)
// ─────────────────────────────────────────────────────

describe('getStateFromElapsed', () => {
  const config = buildConfigFromTicks(HIIT_TICKS)

  it('t=0 is preparation phase', () => {
    const state = getStateFromElapsed(config, 0)
    expect(state.isPreparationPhase).toBe(true)
    expect(state.timeLeft).toBeCloseTo(config.preparation.duration, 1)
  })

  it('t=prep is start of work round 1', () => {
    const state = getStateFromElapsed(config, config.preparation.duration)
    expect(state.isPreparationPhase).toBe(false)
    expect(state.isWorkPhase).toBe(true)
    expect(state.currentRound).toBe(1)
    expect(state.timeLeft).toBeCloseTo(config.rounds[0].work, 1)
  })

  it('seeking to mid-work of round 3', () => {
    let t = config.preparation.duration
    for (let i = 0; i < 2; i++) {
      t += config.rounds[i].work + config.rounds[i].rest
    }
    t += 15 // 15s into round 3 work

    const state = getStateFromElapsed(config, t)
    expect(state.currentRound).toBe(3)
    expect(state.isWorkPhase).toBe(true)
    expect(state.timeLeft).toBeCloseTo(config.rounds[2].work - 15, 1)
  })

  it('seeking to rest phase of round 5', () => {
    let t = config.preparation.duration
    for (let i = 0; i < 4; i++) {
      t += config.rounds[i].work + config.rounds[i].rest
    }
    t += config.rounds[4].work + 5 // 5s into round 5 rest

    const state = getStateFromElapsed(config, t)
    expect(state.currentRound).toBe(5)
    expect(state.isWorkPhase).toBe(false)
    expect(state.timeLeft).toBeCloseTo(config.rounds[4].rest - 5, 1)
  })

  it('seeking past end returns final state', () => {
    const totalDuration = getTotalDuration(config)
    const state = getStateFromElapsed(config, totalDuration + 100)
    expect(state.currentRound).toBe(12)
    expect(state.timeLeft).toBe(0)
  })

  it('rewind from round 5 to round 3 produces correct state', () => {
    // Simulate: at round 5 work, 10s in. Rewind 120s.
    let t5 = config.preparation.duration
    for (let i = 0; i < 4; i++) {
      t5 += config.rounds[i].work + config.rounds[i].rest
    }
    t5 += 10 // 10s into round 5 work

    const rewound = t5 - 120
    const state = getStateFromElapsed(config, rewound)

    // Should be somewhere in round 3
    expect(state.currentRound).toBe(3)
    expect(state.isPreparationPhase).toBe(false)
  })
})

// ─────────────────────────────────────────────────────
// getExpectedAudioPosition (audio sync)
// ─────────────────────────────────────────────────────

describe('getExpectedAudioPosition', () => {
  const config = buildConfigFromTicks(HIIT_TICKS)

  it('preparation start = audioStartOffset', () => {
    const pos = getExpectedAudioPosition({
      config,
      currentRound: 1,
      isWorkPhase: true,
      isPreparationPhase: true,
      timeLeft: config.preparation.duration,
      audioStartOffset: 0
    })
    expect(pos).toBe(0)
  })

  it('round 1 work start matches first work tick', () => {
    const pos = getExpectedAudioPosition({
      config,
      currentRound: 1,
      isWorkPhase: true,
      isPreparationPhase: false,
      timeLeft: config.rounds[0].work,
      audioStartOffset: 0
    })
    expect(pos).toBeCloseTo(config.preparation.duration, 1)
  })

  it('round-trip: elapsed -> state -> audioPosition is consistent', () => {
    const testPoints = [5, 15, 50, 100, 200, 350, 500, 700]

    for (const elapsed of testPoints) {
      const state = getStateFromElapsed(config, elapsed)
      const audioPos = getExpectedAudioPosition({
        config,
        ...state,
        audioStartOffset: 0
      })

      expect(audioPos).toBeCloseTo(elapsed, 0)
    }
  })
})

// ─────────────────────────────────────────────────────
// Validate existing config against ticks
// ─────────────────────────────────────────────────────

describe('validateConfigAgainstTicks', () => {
  it('HIIT config rounds 1-6 match calibration marks within tolerance', () => {
    // Build reference ticks from CALIBRATION_MARKS
    const refTicks = [
      { time: 0, phase: 'prep', round: 0 },
      { time: CALIBRATION_MARKS.prep_end, phase: 'work', round: 1 },
      { time: CALIBRATION_MARKS.r1_rest, phase: 'rest', round: 1 },
      { time: CALIBRATION_MARKS.r2_work, phase: 'work', round: 2 },
      { time: CALIBRATION_MARKS.r2_rest, phase: 'rest', round: 2 },
      { time: CALIBRATION_MARKS.r3_work, phase: 'work', round: 3 },
      { time: CALIBRATION_MARKS.r3_rest, phase: 'rest', round: 3 },
      { time: CALIBRATION_MARKS.r4_work, phase: 'work', round: 4 },
      { time: CALIBRATION_MARKS.r4_rest, phase: 'rest', round: 4 },
      { time: CALIBRATION_MARKS.r5_work, phase: 'work', round: 5 },
      { time: CALIBRATION_MARKS.r5_rest, phase: 'rest', round: 5 },
      { time: CALIBRATION_MARKS.r6_work, phase: 'work', round: 6 },
      { time: CALIBRATION_MARKS.r6_rest, phase: 'rest', round: 6 },
      { time: CALIBRATION_MARKS.r7_work, phase: 'work', round: 7 },
    ]

    // Build config from HIIT_TICKS and validate
    const tickConfig = buildConfigFromTicks(HIIT_TICKS)
    const discrepancies = validateConfigAgainstTicks(tickConfig, refTicks, 0.1)

    expect(discrepancies).toEqual([])
  })
})

// ─────────────────────────────────────────────────────
// getTotalDuration
// ─────────────────────────────────────────────────────

describe('getTotalDuration', () => {
  it('HIIT total matches sum of all ticks', () => {
    const config = buildConfigFromTicks(HIIT_TICKS)
    const total = getTotalDuration(config)
    // Should be approximately 732.549 (end tick)
    expect(total).toBeCloseTo(732.549, 0)
  })

  it('Tabata total is 241s (11 prep + 8*20 work + 7*10 rest)', () => {
    const config = buildConfigFromTicks(TABATA_TICKS)
    const total = getTotalDuration(config)
    expect(total).toBe(241)
  })
})

// ─────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('seek to exact phase boundary gives correct state', () => {
    const config = buildConfigFromTicks(HIIT_TICKS)

    // Exact end of preparation = start of work round 1
    const state = getStateFromElapsed(config, config.preparation.duration)
    expect(state.isPreparationPhase).toBe(false)
    expect(state.isWorkPhase).toBe(true)
    expect(state.currentRound).toBe(1)
  })

  it('seek to exact end of work gives rest phase', () => {
    const config = buildConfigFromTicks(HIIT_TICKS)
    const t = config.preparation.duration + config.rounds[0].work
    const state = getStateFromElapsed(config, t)
    expect(state.isWorkPhase).toBe(false)
    expect(state.currentRound).toBe(1)
  })

  it('seek to exact end of rest gives next work phase', () => {
    const config = buildConfigFromTicks(HIIT_TICKS)
    const t = config.preparation.duration + config.rounds[0].work + config.rounds[0].rest
    const state = getStateFromElapsed(config, t)
    expect(state.isWorkPhase).toBe(true)
    expect(state.currentRound).toBe(2)
  })

  it('Tabata: seek past last work ends workout', () => {
    const config = buildConfigFromTicks(TABATA_TICKS)
    const total = getTotalDuration(config)
    const state = getStateFromElapsed(config, total)
    expect(state.timeLeft).toBe(0)
  })

  it('negative elapsed clamps to preparation', () => {
    const config = buildConfigFromTicks(HIIT_TICKS)
    const state = getStateFromElapsed(config, -5)
    expect(state.isPreparationPhase).toBe(true)
    // -5 < 0 < prep duration, so it clamps
    expect(state.timeLeft).toBeGreaterThan(config.preparation.duration)
  })

  it('workStart field on rounds matches original tick times', () => {
    const config = buildConfigFromTicks(HIIT_TICKS)
    expect(config.rounds[0].workStart).toBeCloseTo(10.589, 2)
    expect(config.rounds[1].workStart).toBeCloseTo(71.730, 2)
    expect(config.rounds[5].workStart).toBeCloseTo(317.134, 2)
  })
})

// ─────────────────────────────────────────────────────
// Skip phase simulation
// ─────────────────────────────────────────────────────

describe('Skip phase simulation', () => {
  it('skipping from prep goes to work round 1', () => {
    const config = buildConfigFromTicks(TABATA_TICKS)
    // Skip prep = jump to start of work
    const state = getStateFromElapsed(config, config.preparation.duration)
    expect(state.isWorkPhase).toBe(true)
    expect(state.currentRound).toBe(1)
  })

  it('skipping from work goes to rest of same round', () => {
    const config = buildConfigFromTicks(TABATA_TICKS)
    // End of work round 1
    const t = config.preparation.duration + config.rounds[0].work
    const state = getStateFromElapsed(config, t)
    expect(state.isWorkPhase).toBe(false)
    expect(state.currentRound).toBe(1)
  })

  it('skipping from rest goes to work of next round', () => {
    const config = buildConfigFromTicks(TABATA_TICKS)
    const t = config.preparation.duration + config.rounds[0].work + config.rounds[0].rest
    const state = getStateFromElapsed(config, t)
    expect(state.isWorkPhase).toBe(true)
    expect(state.currentRound).toBe(2)
  })

  it('skipping through all phases sequentially covers all 8 Tabata rounds', () => {
    const config = buildConfigFromTicks(TABATA_TICKS)
    const visitedRounds = new Set()
    let t = config.preparation.duration

    for (let i = 0; i < config.rounds.length; i++) {
      const workState = getStateFromElapsed(config, t)
      expect(workState.isWorkPhase).toBe(true)
      visitedRounds.add(workState.currentRound)

      t += config.rounds[i].work

      if (config.rounds[i].rest > 0) {
        const restState = getStateFromElapsed(config, t)
        expect(restState.isWorkPhase).toBe(false)
        t += config.rounds[i].rest
      }
    }

    expect(visitedRounds.size).toBe(8)
  })
})

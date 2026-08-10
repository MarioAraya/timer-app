/**
 * HIIT Ticks - Absolute MP3 timestamps for phase transitions
 * Source: hiit_next-level_40-20_x12.mp3
 * Calibrated: 2026-08-10 (supersedes the 2026-02-11 pass)
 *
 * Each tick marks the exact moment in the MP3 where a phase begins.
 * The ticksEngine derives work/rest durations automatically.
 *
 * Measured with SPACE in the app against audio.currentTime — see
 * docs/HIIT_CALIBRATION_NEXT_LEVEL.md for the raw session and the analysis.
 *
 * The track runs ~40.9s work / ~20.4s rest, not the 40/20 its filename claims.
 * Every round here is measured; nothing is extrapolated.
 */

export const HIIT_TICKS = [
  // Preparation
  { time: 0,       phase: 'prep',  subtitle: 'Get ready!' },

  // Round 1
  { time: 10.315,  phase: 'work',  round: 1,  subtitle: "Let's go! Round 1!" },
  { time: 51.284,  phase: 'rest',  round: 1,  subtitle: 'Breathe... recover' },

  // Round 2
  { time: 71.718,  phase: 'work',  round: 2,  subtitle: 'Push it! Round 2!' },
  { time: 112.520, phase: 'rest',  round: 2,  subtitle: 'Breathe... recover' },

  // Round 3
  { time: 133.004, phase: 'work',  round: 3,  subtitle: 'Keep going! Round 3!' },
  { time: 173.892, phase: 'rest',  round: 3,  subtitle: 'Breathe... recover' },

  // Round 4
  { time: 194.202, phase: 'work',  round: 4,  subtitle: 'You got this! Round 4!' },
  { time: 235.118, phase: 'rest',  round: 4,  subtitle: 'Breathe... recover' },

  // Round 5
  { time: 255.517, phase: 'work',  round: 5,  subtitle: 'Halfway there! Round 5!' },
  { time: 296.446, phase: 'rest',  round: 5,  subtitle: 'Breathe... recover' },

  // Round 6
  { time: 316.842, phase: 'work',  round: 6,  subtitle: "Don't stop! Round 6!" },
  { time: 357.701, phase: 'rest',  round: 6,  subtitle: 'Breathe... recover' },

  // Round 7
  { time: 378.188, phase: 'work',  round: 7,  subtitle: 'Second half! Round 7!' },
  { time: 418.955, phase: 'rest',  round: 7,  subtitle: 'Breathe... recover' },

  // Round 8
  { time: 439.409, phase: 'work',  round: 8,  subtitle: 'Stay strong! Round 8!' },
  { time: 480.233, phase: 'rest',  round: 8,  subtitle: 'Breathe... recover' },

  // Round 9
  { time: 500.674, phase: 'work',  round: 9,  subtitle: 'Almost there! Round 9!' },
  { time: 541.557, phase: 'rest',  round: 9,  subtitle: 'Breathe... recover' },

  // Round 10
  { time: 561.970, phase: 'work',  round: 10, subtitle: 'Final push! Round 10!' },
  { time: 602.820, phase: 'rest',  round: 10, subtitle: 'Breathe... recover' },

  // Round 11
  { time: 623.311, phase: 'work',  round: 11, subtitle: 'One more after this! Round 11!' },
  { time: 664.090, phase: 'rest',  round: 11, subtitle: 'Breathe... recover' },

  // Round 12 - Final
  { time: 684.560, phase: 'work',  round: 12, subtitle: 'FINAL ROUND! Give it all!' },
  { time: 725.629, phase: 'rest',  round: 12, subtitle: 'Amazing workout!' },

  // End of the MP3
  { time: 747.027, phase: 'end' }
]

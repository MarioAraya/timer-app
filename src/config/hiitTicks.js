/**
 * HIIT Ticks - Absolute MP3 timestamps for phase transitions
 * Source: hiit_next-level_40-20.mp3
 * Calibrated: 2026-02-11
 *
 * Each tick marks the exact moment in the MP3 where a phase begins.
 * The ticksEngine derives work/rest durations automatically.
 */

export const HIIT_TICKS = [
  // Preparation
  { time: 0,       phase: 'prep',  subtitle: 'Get ready!' },

  // Round 1
  { time: 10.589,  phase: 'work',  round: 1,  subtitle: "Let's go! Round 1!" },
  { time: 51.324,  phase: 'rest',  round: 1,  subtitle: 'Breathe... recover' },

  // Round 2
  { time: 71.730,  phase: 'work',  round: 2,  subtitle: 'Push it! Round 2!' },
  { time: 112.797, phase: 'rest',  round: 2,  subtitle: 'Breathe... recover' },

  // Round 3
  { time: 132.877, phase: 'work',  round: 3,  subtitle: 'Keep going! Round 3!' },
  { time: 173.863, phase: 'rest',  round: 3,  subtitle: 'Breathe... recover' },

  // Round 4
  { time: 194.310, phase: 'work',  round: 4,  subtitle: 'You got this! Round 4!' },
  { time: 235.048, phase: 'rest',  round: 4,  subtitle: 'Breathe... recover' },

  // Round 5
  { time: 255.555, phase: 'work',  round: 5,  subtitle: 'Halfway there! Round 5!' },
  { time: 296.424, phase: 'rest',  round: 5,  subtitle: 'Breathe... recover' },

  // Round 6
  { time: 317.134, phase: 'work',  round: 6,  subtitle: "Don't stop! Round 6!" },
  { time: 357.645, phase: 'rest',  round: 6,  subtitle: 'Breathe... recover' },

  // Round 7 (estimated from R6 rest end + standard timing)
  { time: 383.549, phase: 'work',  round: 7,  subtitle: 'Second half! Round 7!' },
  { time: 423.549, phase: 'rest',  round: 7,  subtitle: 'Breathe... recover' },

  // Round 8
  { time: 443.549, phase: 'work',  round: 8,  subtitle: 'Stay strong! Round 8!' },
  { time: 483.549, phase: 'rest',  round: 8,  subtitle: 'Breathe... recover' },

  // Round 9
  { time: 503.549, phase: 'work',  round: 9,  subtitle: 'Almost there! Round 9!' },
  { time: 543.549, phase: 'rest',  round: 9,  subtitle: 'Breathe... recover' },

  // Round 10
  { time: 563.549, phase: 'work',  round: 10, subtitle: 'Final push! Round 10!' },
  { time: 603.549, phase: 'rest',  round: 10, subtitle: 'Breathe... recover' },

  // Round 11
  { time: 623.549, phase: 'work',  round: 11, subtitle: 'One more after this! Round 11!' },
  { time: 663.549, phase: 'rest',  round: 11, subtitle: 'Breathe... recover' },

  // Round 12 - Final
  { time: 683.549, phase: 'work',  round: 12, subtitle: 'FINAL ROUND! Give it all!' },
  { time: 723.549, phase: 'rest',  round: 12, subtitle: 'Amazing workout!' },

  // End marker
  { time: 732.549, phase: 'end' }
]

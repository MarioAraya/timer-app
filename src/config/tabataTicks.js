/**
 * Tabata Ticks - Absolute MP3 timestamps for phase transitions
 * Source: tabata_rocky_20-10_x4.mp3
 *
 * Standard Tabata protocol: 20s work / 10s rest x 8 rounds
 * These ticks need to be calibrated against the actual MP3.
 * Current values are based on standard timing with 11s prep.
 */

export const TABATA_TICKS = [
  // Preparation
  { time: 0,    phase: 'prep',  subtitle: 'Get ready to push your limits!' },

  // Round 1
  { time: 11,   phase: 'work',  round: 1,  subtitle: 'Maximum effort! Round 1!' },
  { time: 31,   phase: 'rest',  round: 1,  subtitle: 'Breathe and recover' },

  // Round 2
  { time: 41,   phase: 'work',  round: 2,  subtitle: 'Keep the intensity! Round 2!' },
  { time: 61,   phase: 'rest',  round: 2,  subtitle: 'Breathe and recover' },

  // Round 3
  { time: 71,   phase: 'work',  round: 3,  subtitle: 'Push harder! Round 3!' },
  { time: 91,   phase: 'rest',  round: 3,  subtitle: 'Breathe and recover' },

  // Round 4
  { time: 101,  phase: 'work',  round: 4,  subtitle: 'Halfway there! Round 4!' },
  { time: 121,  phase: 'rest',  round: 4,  subtitle: 'Breathe and recover' },

  // Round 5
  { time: 131,  phase: 'work',  round: 5,  subtitle: "Don't quit now! Round 5!" },
  { time: 151,  phase: 'rest',  round: 5,  subtitle: 'Breathe and recover' },

  // Round 6
  { time: 161,  phase: 'work',  round: 6,  subtitle: 'Two more rounds! Round 6!' },
  { time: 181,  phase: 'rest',  round: 6,  subtitle: 'Breathe and recover' },

  // Round 7
  { time: 191,  phase: 'work',  round: 7,  subtitle: 'One more after this! Round 7!' },
  { time: 211,  phase: 'rest',  round: 7,  subtitle: 'Breathe and recover' },

  // Round 8 - Final (no rest)
  { time: 221,  phase: 'work',  round: 8,  subtitle: 'Final round - give it everything!' },

  // End marker
  { time: 241,  phase: 'end',   subtitle: 'You crushed it!' }
]

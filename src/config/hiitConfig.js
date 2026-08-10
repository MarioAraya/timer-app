// HIIT Timer Configuration
// Calibrated from: hiit_next-level_40-20_x12.mp3
// Calibration date: 2026-08-10 (supersedes 2026-02-11)
//
// Every round below is measured against the MP3, none extrapolated.
// Raw session and analysis: docs/HIIT_CALIBRATION_NEXT_LEVEL.md
// Absolute tick timestamps: src/config/hiitTicks.js
//
// The track runs ~40.9s work / ~20.4s rest despite the 40/20 in its filename.
// Rounding those to 40.00/20.00 drifts ~1.4s per round — over 15s of lag by
// round 12, which is what the previous config did for rounds 7-12.

export const HIIT_CONFIG = {
  song: {
    title: "Next Level - HIIT 40/20",
    mp3File: "/hiit_next-level_40-20_x12.mp3",
    totalDuration: "12:27"
  },

  // The first work tick sits at 10.315s of the MP3, but playback starts at
  // HIIT_AUDIO_CONFIG.startTime (1.37s), so the timer only has to cover the
  // remainder: 10.315 - 1.37 = 8.945.
  // This offset applies to preparation only — every other duration is a
  // difference between consecutive ticks, where the offset cancels out.
  preparation: {
    duration: 8.945,
    subtitle: "Get ready!"
  },

  // 12 rounds, all calibrated from audio marks
  rounds: [
    {
      // Round 1: WORK 10.315s, REST 51.284s
      work: 40.969,
      rest: 20.434,
      workSubtitle: "Let's go! Round 1!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 2: WORK 71.718s, REST 112.520s
      work: 40.802,
      rest: 20.484,
      workSubtitle: "Push it! Round 2!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 3: WORK 133.004s, REST 173.892s
      work: 40.888,
      rest: 20.310,
      workSubtitle: "Keep going! Round 3!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 4: WORK 194.202s, REST 235.118s
      work: 40.916,
      rest: 20.399,
      workSubtitle: "You got this! Round 4!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 5: WORK 255.517s, REST 296.446s
      work: 40.929,
      rest: 20.396,
      workSubtitle: "Halfway there! Round 5!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 6: WORK 316.842s, REST 357.701s
      work: 40.859,
      rest: 20.487,
      workSubtitle: "Don't stop! Round 6!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 7: WORK 378.188s, REST 418.955s
      work: 40.767,
      rest: 20.454,
      workSubtitle: "Second half! Round 7!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 8: WORK 439.409s, REST 480.233s
      work: 40.824,
      rest: 20.441,
      workSubtitle: "Stay strong! Round 8!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 9: WORK 500.674s, REST 541.557s
      work: 40.883,
      rest: 20.413,
      workSubtitle: "Almost there! Round 9!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 10: WORK 561.970s, REST 602.820s
      work: 40.850,
      rest: 20.491,
      workSubtitle: "Final push! Round 10!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 11: WORK 623.311s, REST 664.090s
      work: 40.779,
      rest: 20.470,
      workSubtitle: "One more after this! Round 11!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 12: WORK 684.560s, REST 725.629s
      // The final rest runs to the end of the MP3 (747.027s) — outro, not a
      // real 20s recovery.
      work: 41.069,
      rest: 21.398,
      workSubtitle: "FINAL ROUND! Give it all!",
      restSubtitle: "Amazing workout!"
    }
  ]
}

// Helper function to calculate total workout time
export const calculateTotalTime = () => {
  const prepTime = HIIT_CONFIG.preparation.duration
  const roundsTime = HIIT_CONFIG.rounds.reduce((total, round) => {
    return total + round.work + round.rest
  }, 0)

  const totalSeconds = prepTime + roundsTime
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Raw calibration timestamps for reference (absolute MP3 seconds)
export const CALIBRATION_MARKS = {
  prep_end: 10.315,   // WORK Round 1 starts
  r1_rest: 51.284,
  r2_work: 71.718,
  r2_rest: 112.520,
  r3_work: 133.004,
  r3_rest: 173.892,
  r4_work: 194.202,
  r4_rest: 235.118,
  r5_work: 255.517,
  r5_rest: 296.446,
  r6_work: 316.842,
  r6_rest: 357.701,
  r7_work: 378.188,
  r7_rest: 418.955,
  r8_work: 439.409,
  r8_rest: 480.233,
  r9_work: 500.674,
  r9_rest: 541.557,
  r10_work: 561.970,
  r10_rest: 602.820,
  r11_work: 623.311,
  r11_rest: 664.090,
  r12_work: 684.560,
  r12_rest: 725.629,
  mp3_end: 747.027,
}

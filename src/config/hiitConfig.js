// HIIT Timer Configuration
// Calibrated from: hiit_next-level_40-20.mp3
// Calibration date: 2026-02-11

export const HIIT_CONFIG = {
  song: {
    title: "Next Level - HIIT 40/20",
    mp3File: "/hiit_next-level_40-20.mp3",
    totalDuration: "12:09"
  },

  // Preparation phase (intro before round 1)
  preparation: {
    duration: 9,
    subtitle: "Get ready!"
  },

  // 12 rounds calibrated to MP3
  // Rounds 1-6: calibrated from audio marks
  // Rounds 7-12: standard 40s work / 20s rest
  rounds: [
    {
      // Round 1: WORK starts 10.589s, REST starts 51.324s
      work: 40.74,  // 51.324 - 10.589
      rest: 20.41,  // 71.730 - 51.324
      workSubtitle: "Let's go! Round 1!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 2: WORK starts 71.730s, REST starts 112.797s
      work: 41.07,  // 112.797 - 71.730
      rest: 20.08,  // 132.877 - 112.797
      workSubtitle: "Push it! Round 2!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 3: WORK starts 132.877s, REST starts 173.863s
      work: 40.99,  // 173.863 - 132.877
      rest: 20.45,  // 194.310 - 173.863
      workSubtitle: "Keep going! Round 3!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 4: WORK starts 194.310s, REST starts 235.048s
      work: 40.74,  // 235.048 - 194.310
      rest: 20.51,  // 255.555 - 235.048
      workSubtitle: "You got this! Round 4!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 5: WORK starts 255.555s, REST starts 296.424s
      work: 40.87,  // 296.424 - 255.555
      rest: 20.71,  // 317.134 - 296.424
      workSubtitle: "Halfway there! Round 5!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 6: WORK starts 317.134s, REST starts 357.645s
      work: 40.51,  // 357.645 - 317.134
      rest: 25.90,  // 383.549 - 357.645 (longer transition)
      workSubtitle: "Don't stop! Round 6!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 7: WORK starts 383.549s (from calibration)
      work: 40.00,
      rest: 20.00,
      workSubtitle: "Second half! Round 7!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 8
      work: 40.00,
      rest: 20.00,
      workSubtitle: "Stay strong! Round 8!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 9
      work: 40.00,
      rest: 20.00,
      workSubtitle: "Almost there! Round 9!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 10
      work: 40.00,
      rest: 20.00,
      workSubtitle: "Final push! Round 10!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 11
      work: 40.00,
      rest: 20.00,
      workSubtitle: "One more after this! Round 11!",
      restSubtitle: "Breathe... recover"
    },
    {
      // Round 12 - Final round
      work: 40.00,
      rest: 9.00,  // Outro / cooldown
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

// Raw calibration timestamps for reference
export const CALIBRATION_MARKS = {
  // From audio calibration 2026-02-11
  prep_end: 10.589,      // WORK Round 1 starts
  r1_rest: 51.324,       // REST Round 1 starts
  r2_work: 71.730,       // WORK Round 2 starts
  r2_rest: 112.797,      // REST Round 2 starts
  r3_work: 132.877,      // WORK Round 3 starts
  r3_rest: 173.863,      // REST Round 3 starts
  r4_work: 194.310,      // WORK Round 4 starts
  r4_rest: 235.048,      // REST Round 4 starts
  r5_work: 255.555,      // WORK Round 5 starts
  r5_rest: 296.424,      // REST Round 5 starts
  r6_work: 317.134,      // WORK Round 6 starts
  r6_rest: 357.645,      // REST Round 6 starts
  r7_work: 383.549,      // WORK Round 7 starts (last calibrated mark)
}

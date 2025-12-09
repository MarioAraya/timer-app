// Tabata Timer Configuration
// Modify these settings to customize your Tabata workout timing and phrases

export const TABATA_CONFIG = {
  // Song information
  song: {
    title: "Tabata Rocky Workout",
    audioPath: "/tabata_rocky_20-10_x4.mp3",
    totalDuration: "4:00"
  },

  // Preparation phase (time before first round starts)
  preparation: {
    duration: 11, // seconds - countdown before workout
    subtitle: "Get ready to push your limits!" // optional message during preparation
  },

  // Workout rounds configuration
  // Tabata protocol: 20 seconds work, 10 seconds rest, 8 rounds
  rounds: [
    {
      work: 20, // Round 1: 20 seconds work
      rest: 10, // 10 seconds rest
      workSubtitle: "Maximum effort! Round 1!",
      restSubtitle: "Breathe and recover"
    },
    {
      work: 20, // Round 2: 20 seconds work
      rest: 10, // 10 seconds rest
      workSubtitle: "Keep the intensity! Round 2!",
      restSubtitle: "Breathe and recover"
    },
    {
      work: 20, // Round 3: 20 seconds work
      rest: 10, // 10 seconds rest
      workSubtitle: "Push harder! Round 3!",
      restSubtitle: "Breathe and recover"
    },
    {
      work: 20, // Round 4: 20 seconds work
      rest: 10, // 10 seconds rest
      workSubtitle: "Halfway there! Round 4!",
      restSubtitle: "Breathe and recover"
    },
    {
      work: 20, // Round 5: 20 seconds work
      rest: 10, // 10 seconds rest
      workSubtitle: "Don't quit now! Round 5!",
      restSubtitle: "Breathe and recover"
    },
    {
      work: 20, // Round 6: 20 seconds work
      rest: 10, // 10 seconds rest
      workSubtitle: "Two more rounds! Round 6!",
      restSubtitle: "Breathe and recover"
    },
    {
      work: 20, // Round 7: 20 seconds work
      rest: 10, // 10 seconds rest
      workSubtitle: "One more after this! Round 7!",
      restSubtitle: "Breathe and recover"
    },
    {
      work: 20, // Round 8: 20 seconds work (final round - no rest after)
      rest: 0, // No rest after final work phase
      workSubtitle: "Final round - give it everything!",
      restSubtitle: "🎉 You crushed it!"
    }
  ]
}

// Helper function to calculate total workout time
export const calculateTabataTotalTime = () => {
  const prepTime = TABATA_CONFIG.preparation.duration
  const roundsTime = TABATA_CONFIG.rounds.reduce((total, round) => {
    return total + round.work + round.rest
  }, 0)

  const totalSeconds = prepTime + roundsTime
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Export individual configurations for different songs/workouts
export const TABATA_SONG_CONFIGURATIONS = {
  // Current default configuration
  default: TABATA_CONFIG,

  // Example: Different song configuration
  // You can add more song configurations here
  // rocky: {
  //   song: {
  //     title: "Rocky Theme Tabata",
  //     audioPath: "/tabata_rocky_20-10_x4.mp3",
  //     totalDuration: "4:00"
  //   },
  //   preparation: { duration: 7, subtitle: "Eye of the tiger!" },
  //   rounds: [
  //     // ... custom rounds
  //   ]
  // }
}

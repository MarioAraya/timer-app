// HIIT Timer Configuration
// Modify these settings to customize your HIIT workout timing and phrases

export const HIIT_CONFIG = {
  // Song information
  song: {
    title: "HIIT Workout Song", 
    youtubeUrl: "https://www.youtube.com/watch?v=your-video-id",
    totalDuration: "12:09"
  },
  
  // Preparation phase (time before first round starts)
  preparation: {
    duration: 9, // seconds - intro countdown before workout
    subtitle: "Get ready to start!" // optional message during preparation
  },
  
  // Workout rounds configuration based on exact song timing
  rounds: [
    {
      work: 41.66, // Vuelta 2: 00:40,22 (first work phase)
      rest: 19.33, // Vuelta 3: 00:19,53 (first rest phase - reduced 1s to start round 2 earlier)
      workSubtitle: "Go! Go! Go! Round one!",
      restSubtitle: "Break, break, break!"
    },
    {
      work: 39.66, // Vuelta 4: 00:40,78
      rest: 19.33, // Vuelta 5: 00:20,38
      workSubtitle: "Go! Go! Go! Round two!",
      restSubtitle: "Break, break, break!"
    },
    {
      work: 39.66, // Vuelta 6: 00:40,95
      rest: 19.33, // Vuelta 7: 00:20,35
      workSubtitle: "Go! Go! Go! Round three!",
      restSubtitle: "Break, break, break!"
    },
    {
      work: 40.93, // Vuelta 8: 00:40,93
      rest: 19.50, // Vuelta 9: 00:20,50
      workSubtitle: "Go! Go! Go! Round four!",
      restSubtitle: "Break, break, break!"
    },
    {
      work: 40.31, // Vuelta 10: 00:40,31
      rest: 20.95, // Vuelta 11: 00:20,95
      workSubtitle: "Go! Go! Go! Round five!",
      restSubtitle: "Break, break, break!"
    },
    {
      work: 40.03, // Vuelta 12: 00:40,03
      rest: 20.00, // Vuelta 13: 00:20,19
      workSubtitle: "Go! Go! Go! Round six!",
      restSubtitle: "Break, break, break!"
    },
    {
      work: 40.00, // Vuelta 14: 00:40,93
      rest: 20.00, // Vuelta 15: 00:20,40
      workSubtitle: "Go! Go! Go! Round seven!",
      restSubtitle: "Break, break, break!"
    },
    {
      work: 40.00, // Vuelta 16: 00:40,83
      rest: 20.00, // Vuelta 17: 00:20,34
      workSubtitle: "Go! Go! Go! Round eight!",
      restSubtitle: "Break, break, break!"
    },
    {
      work: 40.00, // Vuelta 18: 00:40,73
      rest: 20.00, // Vuelta 19: 00:20,56
      workSubtitle: "Go! Go! Go! Round nine!",
      restSubtitle: "Break, break, break!"
    },
    {
      work: 40.00, // Vuelta 20: 00:40,65
      rest: 20.00, // Vuelta 21: 00:20,56
      workSubtitle: "Go! Go! Go! Round ten!",
      restSubtitle: "Break, break, break!"
    },
    {
      work: 40.00, // Vuelta 22: 00:40,05
      rest: 20.00, // Vuelta 23: 00:20,18
      workSubtitle: "Round eleven!",
      restSubtitle: "Break, break, break!"
    },
    {
      work: 40.00, // Vuelta 24: 00:40,95
      rest: 13.00, // Vuelta 25: 00:13,98 (final rest)
      workSubtitle: "Final round, champ!",
      restSubtitle: "Final rest - you did it!"
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

// Export individual configurations for different songs/workouts
export const SONG_CONFIGURATIONS = {
  // Current default configuration
  default: HIIT_CONFIG,
  
  // Example: Different song configuration
  // songName: {
  //   song: {
  //     title: "Different Song",
  //     youtubeUrl: "https://www.youtube.com/watch?v=different-id",
  //     totalDuration: "10:00"
  //   },
  //   preparation: { duration: 8, subtitle: "Get ready!" },
  //   rounds: [
  //     { work: 30, rest: 15, workSubtitle: "Work!", restSubtitle: "Rest!" },
  //     // ... more rounds
  //   ]
  // }
}
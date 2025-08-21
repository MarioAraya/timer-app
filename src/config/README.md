# HIIT Timer Configuration

This directory contains configuration files for customizing your HIIT timer workouts.

## Configuration File: `hiitConfig.js`

### Quick Start

To modify your HIIT workout, edit `/src/config/hiitConfig.js`:

```javascript
export const HIIT_CONFIG = {
  preparation: {
    duration: 9.5, // Start first round at 9.5 seconds
    subtitle: "Get ready!" // Optional preparation message
  },
  
  rounds: [
    {
      work: 40,        // Seconds of work
      rest: 20,        // Seconds of rest
      workSubtitle: "Go! Go! Go! Round one!",
      restSubtitle: "Break, break, break!"
    },
    // ... 12 rounds total
  ]
}
```

### Configuration Options

#### Preparation Phase
- `duration`: Seconds to wait before starting first round (supports decimals like 9.5)
- `subtitle`: Optional message displayed during preparation

#### Rounds Array
Each round object contains:
- `work`: Duration of work phase in seconds
- `rest`: Duration of rest phase in seconds  
- `workSubtitle`: Message displayed during work phase
- `restSubtitle`: Message displayed during rest phase

### Adding Different Song Configurations

You can create multiple configurations for different songs:

```javascript
export const SONG_CONFIGURATIONS = {
  default: HIIT_CONFIG,
  
  mySong: {
    song: {
      title: "My Custom Song",
      youtubeUrl: "https://www.youtube.com/watch?v=your-id",
      totalDuration: "10:00"
    },
    preparation: { duration: 8, subtitle: "Custom prep!" },
    rounds: [
      { work: 30, rest: 15, workSubtitle: "Work!", restSubtitle: "Rest!" },
      // ... more rounds
    ]
  }
}
```

### Helper Functions

- `calculateTotalTime()`: Automatically calculates total workout duration
- Displays as MM:SS format in the timer interface

### Tips

1. **Timing Synchronization**: Adjust `preparation.duration` to sync with your music
2. **Custom Phrases**: Make workSubtitle and restSubtitle motivating and fun
3. **Flexible Rounds**: Each round can have different work/rest durations
4. **Total Duration**: Automatically calculated and displayed

### Example Configurations

#### Standard HIIT (40/20)
```javascript
// 12 rounds of 40s work, 20s rest
rounds: Array(12).fill({ work: 40, rest: 20, ... })
```

#### Tabata Style (20/10)  
```javascript
// 8 rounds of 20s work, 10s rest
rounds: Array(8).fill({ work: 20, rest: 10, ... })
```

#### Custom Progressive
```javascript
rounds: [
  { work: 30, rest: 30 }, // Easy start
  { work: 40, rest: 20 }, // Standard
  { work: 50, rest: 10 }, // Intense finish
]
```
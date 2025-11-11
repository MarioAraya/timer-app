# 🔥 HIIT & Tabata Timer

**The Ultimate Workout Timer with Perfectly Synchronized Music**

A Progressive Web Application (PWA) designed for serious fitness enthusiasts who demand precision timing and motivational music during high-intensity workouts. No more fumbling with your phone between rounds - just pure, focused training.

---

## 🎯 Why This Timer?

Traditional workout timers fall short:
- ❌ Audio stops when screen locks
- ❌ Music and timer aren't synchronized
- ❌ Lose progress when app closes
- ❌ Distracting UI during workouts

**HIIT & Tabata Timer solves all of this:**
- ✅ **Aggressive anti-pause system** keeps music playing even on mobile
- ✅ **Millisecond-precise audio sync** - beats match your work/rest phases
- ✅ **Auto-saves your workout** - resume exactly where you left off
- ✅ **Fullscreen mode** - distraction-free, just you and the workout
- ✅ **Works offline** - download once, train anywhere

---

## 💪 Core Workout Timers

### 🔥 HIIT Timer
**12 Rounds | 40s Work / 20s Rest | 12 Minutes Total**

The HIIT (High-Intensity Interval Training) timer is perfect for:
- Fat burning and cardiovascular conditioning
- Bodyweight exercises (burpees, mountain climbers, jump squats)
- Kettlebell/dumbbell circuits
- Sprint intervals
- Home workouts without equipment

**Features:**
- Synchronized motivational music (`hiit_next-level_40-20.mp3`)
- 10-second preparation phase before starting
- Visual round counter and phase indicators
- Progress bar showing current round
- Celebration confetti on completion

**How It Works:**
```
Preparation: 10 seconds (get ready!)
│
├─ Round 1:  40s Work → 20s Rest
├─ Round 2:  40s Work → 20s Rest
├─ Round 3:  40s Work → 20s Rest
│  ... (9 more rounds)
└─ Round 12: 40s Work → Complete! 🎉
```

---

### ⚡ Tabata Timer
**8 Rounds | 20s Work / 10s Rest | 4 Minutes Total**

The Tabata protocol is scientifically proven to:
- Improve anaerobic capacity
- Boost metabolism for hours post-workout
- Build explosive power
- Maximize results in minimal time

**Perfect For:**
- Quick morning workouts
- Finishers after strength training
- AMRAP (As Many Reps As Possible) challenges
- Competition-style training

**Features:**
- Synchronized high-energy music (`tabata_rocky_20-10.mp3`)
- Ultra-fast 20s/10s intervals
- Intense visual feedback during work phases
- Round counter with motivational messages
- Automatic workout completion detection

**How It Works:**
```
Preparation: 10 seconds (get ready!)
│
├─ Round 1: 20s MAX EFFORT → 10s Rest
├─ Round 2: 20s MAX EFFORT → 10s Rest
├─ Round 3: 20s MAX EFFORT → 10s Rest
│  ... (5 more rounds)
└─ Round 8: 20s MAX EFFORT → Complete! 🎉
```

**Tabata Protocol Info:**
Originally developed by Dr. Izumi Tabata, this 4-minute protocol has been shown to improve both aerobic and anaerobic systems more effectively than moderate-intensity continuous training.

---

## 🎵 Dual Audio Modes

### Music Mode (Default)
Perfectly synchronized MP3 tracks that match your workout rhythm:
- **HIIT:** Upbeat electronic/pop mix designed for 40/20 intervals
- **Tabata:** High-energy rock/motivational music for 20/10 sprints
- Audio continues playing even when screen locks (mobile optimized)
- Watchdog timer auto-resumes if browser tries to pause

### Beep Mode (Alternative)
Simple countdown beeps using Web Audio API:
- Countdown beeps: 3-2-1 at phase transitions
- Work start: High-pitched energetic beep
- Rest start: Lower-pitched calm beep
- Minimal battery usage

**Toggle anytime** during your workout in the timer controls.

---

## 🚀 Key Features

### 📱 Progressive Web App
- **Install on mobile:** Add to home screen, works like native app
- **Offline support:** Train without internet connection
- **No app store:** No downloads, updates, or permissions
- **Cross-platform:** Works on iOS, Android, desktop

### 💾 Smart State Persistence
- **Auto-saves progress:** Pause mid-workout, resume anytime within 1 hour
- **Audio position sync:** Resume exactly where you paused in the music
- **Round tracking:** Never lose your place
- **One-hour expiry:** Old workouts auto-clear to keep it clean

### 🖥️ Fullscreen Workout Mode
- **Double-click to maximize:** Fullscreen, distraction-free display
- **Auto-hiding controls:** Fade out after 3 seconds, reappear on movement
- **Click to pause:** In fullscreen mode, click anywhere to pause/resume
- **Large display:** Easy to see from across the room

### 🎨 Visual Feedback
- **Phase-based colors:** Green for work, blue for rest, yellow for preparation
- **Animated progress bars:** See your progress at a glance
- **Round counters:** Know exactly where you are in the workout
- **Celebration effects:** Confetti animation when you finish

### ⌨️ Intuitive Controls
- **Start/Pause:** Primary button, easy thumb access
- **Skip Phase:** Jump to next work/rest phase
- **Reset:** Start workout from beginning
- **Back Button:** Return to timer selection
- **Swipe Right:** Gesture to go back (mobile)

---

## 🏋️ Sample Workouts

### HIIT Workouts (12 Rounds × 40s/20s)

**Beginner - Bodyweight Basics:**
```
1. Jumping Jacks          7. High Knees
2. Squats                 8. Plank Hold
3. Push-ups (modified)    9. Lunges
4. Mountain Climbers     10. Bicycle Crunches
5. Burpees (modified)    11. Side Plank (R)
6. Rest Walk             12. Side Plank (L)
```

**Intermediate - Fat Burner:**
```
1. Burpees                7. Jump Squats
2. Mountain Climbers      8. Plank Jacks
3. High Knees             9. Push-up to T
4. Jump Lunges           10. Tuck Jumps
5. Bicycle Sprints       11. Bear Crawls
6. Star Jumps            12. Sprint in Place
```

**Advanced - Kettlebell Circuit:**
```
1. KB Swings              7. KB Goblet Squats
2. KB Snatches (R)        8. KB Cleans (R)
3. KB Snatches (L)        9. KB Cleans (L)
4. KB Push Press         10. KB Turkish Get-up
5. KB Rows (R)           11. KB Farmer Carry
6. KB Rows (L)           12. KB Overhead Hold
```

### Tabata Workouts (8 Rounds × 20s/10s)

**Beginner - Single Exercise AMRAP:**
```
All 8 Rounds: Air Squats (as many reps as possible)
Goal: Track total reps, beat your score next time
```

**Intermediate - Upper/Lower Split:**
```
Rounds 1-4: Push-ups (max reps)
Rounds 5-8: Jump Squats (max reps)
```

**Advanced - Full Body Blitz:**
```
Round 1: Burpees          Round 5: Mountain Climbers
Round 2: Jump Squats      Round 6: Burpees
Round 3: Push-ups         Round 7: Tuck Jumps
Round 4: Plank Jacks      Round 8: Sprint in Place
```

---

## 📚 Additional Timers (Bonus Features)

While HIIT and Tabata are the core focus, the app includes additional timer types for well-rounded training:

### 🍅 Pomodoro Timer
**25min Work | 5min Break | 15min Long Break**
- Productivity timer for focused work sessions
- Great for pre-workout meal prep or post-workout journaling
- Tracks multiple sessions with automatic break scheduling

### 🧘 Breathing Timers
**Box Breathing (4-4-4-4) | Relaxing Breath (4-7-8) | Calming Breath (4-2-6)**
- Cool-down exercises after intense workouts
- Pre-workout mindfulness and focus
- Stress reduction and recovery
- Animated visual guides for breathing patterns

---

## 🛠️ Technical Stack

Built with modern web technologies for maximum performance:

- **Preact:** Ultra-lightweight React alternative (4KB)
- **Vite:** Lightning-fast build tool and dev server
- **SCSS:** Modular, maintainable styling
- **Web Audio API:** Synthesized beep sounds
- **HTML5 Audio:** MP3 music playback
- **localStorage:** Persistent state without backend
- **Service Worker:** Offline functionality and caching

**Why These Technologies?**
- **Speed:** Sub-second load times, instant interactions
- **Size:** Tiny bundle size (~45KB gzipped total)
- **Reliability:** Works offline, no server dependencies
- **Performance:** Smooth 60fps animations even on older devices

---

## 🚀 Getting Started

### For Users

1. **Open in Browser:**
   ```
   https://your-deployment-url.com
   ```

2. **Install as App (Optional):**
   - Mobile: Tap "Add to Home Screen" in browser menu
   - Desktop: Click "Install" icon in address bar

3. **Select Timer:**
   - Choose HIIT or Tabata from grid
   - Double-click to enter fullscreen mode

4. **Start Workout:**
   - Press "Start" button
   - Follow on-screen phase indicators
   - Music plays automatically (Music Mode)

5. **Control During Workout:**
   - Click anywhere (fullscreen) to pause/resume
   - Use control buttons to skip or reset
   - Swipe right to exit

### For Developers

```bash
# Clone repository
git clone <repository-url>
cd timer-app

# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Configuration Files:**
- `src/config/hiitConfig.js` - HIIT timing and audio settings
- `src/config/tabataConfig.js` - Tabata timing and audio settings
- `src/utils/audioUtils.js` - Audio player management and watchdog timers

**Key Components:**
- `src/components/HiitTimer.jsx` - HIIT timer implementation
- `src/components/TabataTimer.jsx` - Tabata timer implementation
- `src/utils/localStorage.js` - State persistence logic

---

## 🎵 Adding Custom Music

Want to use your own workout tracks? Here's how:

### 1. Prepare Your Audio File
```bash
# Place MP3 in public folder
cp your-hiit-song.mp3 public/hiit-custom.mp3
```

### 2. Update Configuration
```javascript
// src/config/hiitConfig.js
export const HIIT_CONFIG = {
  preparationTime: 10,
  workTime: 40,
  restTime: 20,
  rounds: 12,

  audio: {
    startTime: 0,  // Adjust if your MP3 has intro
    preparationOffset: 0,
    workPhaseOffset: 10,
    restPhaseOffset: 50,
    roundDuration: 60
  }
};
```

### 3. Update Audio Utils
```javascript
// src/utils/audioUtils.js
export const HIIT_AUDIO_CONFIG = {
  audioPath: '/hiit-custom.mp3',  // Your new file
  startTime: 0,
  url: '/hiit-custom.mp3'
};
```

### 4. Test Synchronization
- Start timer in Music Mode
- Verify beats align with work/rest transitions
- Adjust `startTime` offset if needed (in seconds)

**Pro Tip:** Use music editing software (Audacity, GarageBand) to trim your MP3 to exactly 12 minutes (HIIT) or 4 minutes (Tabata) for perfect looping.

---

## 📱 Mobile Optimization

This app is built **mobile-first** with aggressive optimizations for smartphone training:

### Anti-Pause System
- **Watchdog Timer:** Checks audio every 300ms
- **Auto-Resume:** Detects and fixes unexpected pauses within 3 seconds
- **Ignore Window:** 2-second grace period after intentional pause
- **playsInline:** Prevents fullscreen video player on iOS

### Battery Efficiency
- **Precision Timing:** 100ms update interval, not continuous
- **Conditional Rendering:** Only active timer renders
- **Lazy Audio Loading:** MP3s load on first use
- **Service Worker Cache:** No repeated network requests

### Touch Gestures
- **Double-Tap:** Toggle fullscreen mode
- **Swipe Right:** Navigate back to timer selection
- **Single Tap (Fullscreen):** Pause/resume workout

---

## 🔧 Customization Guide

### Adjusting HIIT Intervals

Want 30s/15s instead of 40s/20s?

```javascript
// src/config/hiitConfig.js
export const HIIT_CONFIG = {
  preparationTime: 10,
  workTime: 30,        // Changed from 40
  restTime: 15,        // Changed from 20
  rounds: 12,

  // Update audio offsets accordingly
  audio: {
    startTime: 1.37,
    preparationOffset: 0,
    workPhaseOffset: 10,
    restPhaseOffset: 40,  // 10s prep + 30s work
    roundDuration: 45     // 30s work + 15s rest
  }
};
```

### Changing Round Count

Want 15 rounds instead of 12?

```javascript
// src/config/hiitConfig.js
export const HIIT_CONFIG = {
  // ... other settings
  rounds: 15,  // Changed from 12
};
```

**Note:** If using Music Mode, ensure your MP3 is long enough for all rounds.

### Adding Volume Control

```javascript
// In your timer component
const [volume, setVolume] = useState(0.7);

// Set audio volume
hiitAudio.volume = volume;
```

---

## 📊 Workout Science

### Why HIIT?

**HIIT (High-Intensity Interval Training)** is proven to:
- Burn more calories in less time than steady-state cardio
- Increase VO2 max (cardiovascular capacity)
- Preserve muscle mass while cutting fat
- Boost metabolism for 24-48 hours post-workout (EPOC effect)
- Improve insulin sensitivity

**40s/20s Split:**
- Long enough work period for substantial effort
- Short enough rest to maintain elevated heart rate
- Balanced for both aerobic and anaerobic benefits

### Why Tabata?

**Tabata Protocol** research shows:
- 20s ultra-high intensity (170% VO2 max)
- 10s rest allows partial recovery
- 8 rounds = 4 minutes total
- Improves both aerobic AND anaerobic systems

**Study Results:**
- 28% increase in anaerobic capacity (6 weeks)
- 14% increase in VO2 max (6 weeks)
- More effective than 60 minutes moderate cardio

**Key:** TRUE Tabata requires maximum effort - if you can do more than 8 rounds, you're not going hard enough!

---

## 🐛 Troubleshooting

### Audio Won't Play

**Problem:** Music doesn't start when timer begins

**Solutions:**
1. Check browser autoplay policy (requires user interaction first)
2. Verify MP3 files exist in `public/` folder
3. Try Beep Mode to isolate issue
4. Check browser console for errors

### Timer Freezes on Mobile

**Problem:** Timer stops when screen locks

**Solutions:**
1. Keep screen on during workout (adjust phone settings)
2. Use Music Mode (audio keeps timer active)
3. Check "Prevent Sleep" in phone battery settings
4. Try different browser (Chrome vs Safari)

### Lost Workout Progress

**Problem:** Timer reset after leaving app

**Solutions:**
1. Ensure localStorage is enabled in browser
2. Check if more than 1 hour passed (auto-expiry)
3. Don't use incognito/private mode
4. Clear browser cache and retry

### Audio Out of Sync

**Problem:** Music doesn't match work/rest phases

**Solutions:**
1. Check `startTime` offset in config file
2. Verify MP3 file hasn't been modified
3. Use Beep Mode as fallback
4. Recalibrate offsets in `hiitConfig.js`

---

## 🗺️ Roadmap

### v1.1 (Coming Soon)
- [ ] Custom interval builder (create your own timings)
- [ ] Workout history and statistics
- [ ] Export/import custom timer configurations
- [ ] Volume slider for music mode

### v1.2 (Planned)
- [ ] Spotify integration
- [ ] Apple Music integration
- [ ] Custom playlist support
- [ ] Multiple music tracks per timer

### v2.0 (Future)
- [ ] User accounts and cloud sync
- [ ] Social features (share workouts, challenges)
- [ ] Apple Watch / Android Wear integration
- [ ] Voice announcements for rounds
- [ ] Dark mode / themes

**Want to contribute?** See `docs/TECHNICAL_DOCUMENTATION.md` for developer guide.

---

## 📖 Documentation

- **User Guide:** This README
- **Technical Documentation:** `docs/TECHNICAL_DOCUMENTATION.md`
- **Architecture Diagram:** `docs/architecture-diagram.drawio`
- **Developer Guide:** See CLAUDE.md

---

## 🤝 Contributing

We welcome contributions! Whether it's:
- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎵 Custom workout music tracks
- 💡 Feature suggestions

### How to Contribute

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test thoroughly (especially audio sync!)
5. Commit: `git commit -m 'feat: Add my feature'`
6. Push: `git push origin feature/my-feature`
7. Open Pull Request

**Commit Message Format:**
```
type(scope): subject

feat: New feature
fix: Bug fix
docs: Documentation
style: Formatting
refactor: Code restructuring
test: Tests
```

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Dr. Izumi Tabata** - For the Tabata protocol research
- **Preact Team** - For the amazing lightweight framework
- **Open Source Community** - For inspiration and tools

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email:** support@your-domain.com

---

## 🔥 Ready to Train?

No more excuses. No more complicated apps. Just pure, focused, high-intensity training with perfectly synchronized music.

**[Start Your Workout Now →](https://your-deployment-url.com)**

---

**Built with 💪 for athletes, by developers who train hard.**

*Last Updated: November 2025*

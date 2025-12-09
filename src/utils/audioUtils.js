// Audio utilities for timer sounds
let audioContext;
let hiitAudio = null;
let tabataAudio = null;

// Initialize audio context if available
const initAudioContext = () => {
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Local MP3 configuration for HIIT workout
export const HIIT_AUDIO_CONFIG = {
  audioPath: '/hiit_next-level_40-20_x12.mp3',
  startTime: 1.37, // seconds - matches preparation time in config
  url: '/hiit_next-level_40-20.mp3'
};

// Local MP3 configuration for Tabata workout
export const TABATA_AUDIO_CONFIG = {
  audioPath: '/tabata_rocky_20-10_x4.mp3',
  startTime: 0, // seconds - start from beginning after preparation
  url: '/tabata_rocky_20-10_x4.mp3'
};

// Local MP3 configuration for Pomodoro work sessions
export const POMODORO_AUDIO_CONFIG = {
  audioPath: '/lofi_morning_routine-chosic.com.mp3',
  startTime: 0, // seconds - start from beginning
  url: '/lofi_morning_routine-chosic.com.mp3'
};

// Audio player state
let audioPlayerReady = false;
let audioPlayerLoading = false;
let tabataPlayerReady = false;
let tabataPlayerLoading = false;
let pomodoroPlayerReady = false;
let pomodoroPlayerLoading = false;

// Track when playback started to ignore spurious pause events
let hiitPlaybackStartTime = 0;
let tabataPlaybackStartTime = 0;
let pomodoroPlaybackStartTime = 0;

// Watchdog timers to auto-resume if paused unexpectedly
let hiitWatchdog = null;
let tabataWatchdog = null;
let pomodoroWatchdog = null;

// Watchdog flags to know if playback should be active
let hiitShouldBePlaying = false;
let tabataShouldBePlaying = false;
let pomodoroShouldBePlaying = false;

// Create and initialize local audio player
const createAudioPlayer = () => {
  return new Promise((resolve) => {
    if (!hiitAudio) {
      hiitAudio = new Audio(HIIT_AUDIO_CONFIG.audioPath);
      hiitAudio.preload = 'auto';

      // Add attributes to prevent unwanted pausing on mobile browsers
      hiitAudio.setAttribute('playsinline', '');
      hiitAudio.setAttribute('webkit-playsinline', '');
      hiitAudio.setAttribute('disableRemotePlayback', '');
      hiitAudio.setAttribute('x-webkit-airplay', 'deny');

      // Set volume to ensure it's audible
      hiitAudio.volume = 0.7;

      // Prevent browser from auto-pausing due to inactivity
      hiitAudio.addEventListener('suspend', (e) => {
        console.log('🔇 Audio suspend event', e);
        // Attempt to resume if we should be playing
        if (hiitShouldBePlaying) {
          setTimeout(() => {
            if (hiitAudio.paused && hiitShouldBePlaying) {
              console.log('🔄 Auto-resuming after suspend');
              hiitAudio.play().catch(err => console.error('Resume after suspend failed:', err));
            }
          }, 100);
        }
      });

      hiitAudio.addEventListener('stalled', (e) => {
        console.log('⚠️ Audio stalled event', e);
      });

      hiitAudio.addEventListener('waiting', (e) => {
        console.log('⏳ Audio waiting event', e);
      });

      hiitAudio.addEventListener('canplaythrough', () => {
        audioPlayerReady = true;
        resolve(true);
      });

      hiitAudio.addEventListener('error', (error) => {
        console.error('Audio loading error:', error);
        audioPlayerReady = false;
        resolve(false);
      });

      hiitAudio.load();
    } else {
      resolve(audioPlayerReady);
    }
  });
};

// Check if audio player is ready
export const isPlayerReady = () => audioPlayerReady;
export const isPlayerLoading = () => audioPlayerLoading;

// Initialize audio player (call this early)
export const initializeAudioPlayer = async () => {
  if (!hiitAudio && !audioPlayerLoading) {
    audioPlayerLoading = true;
    const ready = await createAudioPlayer();
    audioPlayerLoading = false;
    return ready;
  }
  return audioPlayerReady;
};

// Watchdog to detect and fix auto-pauses for HIIT
const startHiitWatchdog = () => {
  if (hiitWatchdog) clearInterval(hiitWatchdog);

  hiitWatchdog = setInterval(() => {
    if (hiitAudio && audioPlayerReady && hiitShouldBePlaying) {
      if (hiitAudio.paused) {
        const timeSinceStart = Date.now() - hiitPlaybackStartTime;
        // Aggressive resume after 500ms (was 3000ms)
        if (timeSinceStart > 500) {
          console.log('⚠️ HIIT auto-pause detected! Resuming... (paused for', timeSinceStart, 'ms)');
          hiitAudio.play().catch(err => console.error('Auto-resume failed:', err));
          hiitPlaybackStartTime = Date.now();
        }
      }
    }
  }, 100); // Check every 100ms (was 300ms)
};

const stopHiitWatchdog = () => {
  if (hiitWatchdog) {
    clearInterval(hiitWatchdog);
    hiitWatchdog = null;
  }
  hiitShouldBePlaying = false;
};

export const playHiitSong = async () => {
  if (!hiitAudio) {
    audioPlayerLoading = true;
    await createAudioPlayer();
    audioPlayerLoading = false;
  }

  if (audioPlayerReady && hiitAudio) {
    try {
      hiitAudio.currentTime = HIIT_AUDIO_CONFIG.startTime;
      await hiitAudio.play();
      hiitPlaybackStartTime = Date.now();
      hiitShouldBePlaying = true;
      startHiitWatchdog();
      console.log('🎵 Playing HIIT song (watchdog enabled)');
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }
};

export const stopHiitSong = () => {
  if (audioPlayerReady && hiitAudio) {
    try {
      stopHiitWatchdog();
      hiitAudio.pause();
      hiitAudio.currentTime = HIIT_AUDIO_CONFIG.startTime;
      console.log('⏹️ Stopping HIIT song');
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }
};

export const pauseHiitSong = () => {
  if (audioPlayerReady && hiitAudio) {
    try {
      stopHiitWatchdog();
      hiitAudio.pause();
      console.log('⏸️ Pausing HIIT song');
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  }
};

export const resumeHiitSong = () => {
  if (audioPlayerReady && hiitAudio) {
    try {
      hiitAudio.play();
      hiitPlaybackStartTime = Date.now();
      hiitShouldBePlaying = true;
      startHiitWatchdog();
      console.log('▶️ Resuming HIIT song (watchdog enabled)');
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  }
};

// Get current audio position
export const getAudioPosition = () => {
  if (audioPlayerReady && hiitAudio) {
    return hiitAudio.currentTime;
  }
  return null;
};

// Set audio position
export const setAudioPosition = (position) => {
  if (audioPlayerReady && hiitAudio && position !== null && position >= 0) {
    try {
      hiitAudio.currentTime = position;
      console.log(`⏩ Setting audio position to ${position.toFixed(2)}s`);
      return true;
    } catch (error) {
      console.error('Error setting audio position:', error);
      return false;
    }
  }
  return false;
};

// Get audio player instance (for checking state)
export const getAudioPlayer = () => hiitAudio;

// Check if audio is currently playing
export const isAudioPlaying = () => {
  if (audioPlayerReady && hiitAudio) {
    return !hiitAudio.paused;
  }
  return false;
};

// Check if we should ignore pause events (within 2 seconds of playback start)
export const shouldIgnoreHiitPause = () => {
  const timeSinceStart = Date.now() - hiitPlaybackStartTime;
  return timeSinceStart < 2000; // Ignore pauses within first 2 seconds
};

// ============ TABATA AUDIO FUNCTIONS ============

// Create and initialize Tabata audio player
const createTabataAudioPlayer = () => {
  return new Promise((resolve) => {
    if (!tabataAudio) {
      tabataAudio = new Audio(TABATA_AUDIO_CONFIG.audioPath);
      tabataAudio.preload = 'auto';

      // Add attributes to prevent unwanted pausing on mobile browsers
      tabataAudio.setAttribute('playsinline', '');
      tabataAudio.setAttribute('webkit-playsinline', '');
      tabataAudio.setAttribute('disableRemotePlayback', '');
      tabataAudio.setAttribute('x-webkit-airplay', 'deny');

      // Set volume to ensure it's audible
      tabataAudio.volume = 0.7;

      // Prevent browser from auto-pausing due to inactivity
      tabataAudio.addEventListener('suspend', (e) => {
        console.log('🔇 Tabata audio suspend event', e);
        // Attempt to resume if we should be playing
        if (tabataShouldBePlaying) {
          setTimeout(() => {
            if (tabataAudio.paused && tabataShouldBePlaying) {
              console.log('🔄 Auto-resuming after suspend');
              tabataAudio.play().catch(err => console.error('Resume after suspend failed:', err));
            }
          }, 100);
        }
      });

      tabataAudio.addEventListener('stalled', (e) => {
        console.log('⚠️ Tabata audio stalled event', e);
      });

      tabataAudio.addEventListener('waiting', (e) => {
        console.log('⏳ Tabata audio waiting event', e);
      });

      tabataAudio.addEventListener('canplaythrough', () => {
        tabataPlayerReady = true;
        resolve(true);
      });

      tabataAudio.addEventListener('error', (error) => {
        console.error('Tabata audio loading error:', error);
        tabataPlayerReady = false;
        resolve(false);
      });

      tabataAudio.load();
    } else {
      resolve(tabataPlayerReady);
    }
  });
};

// Check if Tabata player is ready
export const isTabataPlayerReady = () => tabataPlayerReady;
export const isTabataPlayerLoading = () => tabataPlayerLoading;

// Initialize Tabata audio player
export const initializeTabataAudioPlayer = async () => {
  if (!tabataAudio && !tabataPlayerLoading) {
    tabataPlayerLoading = true;
    const ready = await createTabataAudioPlayer();
    tabataPlayerLoading = false;
    return ready;
  }
  return tabataPlayerReady;
};

// Watchdog to detect and fix auto-pauses for Tabata
const startTabataWatchdog = () => {
  if (tabataWatchdog) clearInterval(tabataWatchdog);

  tabataWatchdog = setInterval(() => {
    if (tabataAudio && tabataPlayerReady && tabataShouldBePlaying) {
      if (tabataAudio.paused) {
        const timeSinceStart = Date.now() - tabataPlaybackStartTime;
        // Aggressive resume after 500ms (was 3000ms)
        if (timeSinceStart > 500) {
          console.log('⚠️ Tabata auto-pause detected! Resuming... (paused for', timeSinceStart, 'ms)');
          tabataAudio.play().catch(err => console.error('Auto-resume failed:', err));
          tabataPlaybackStartTime = Date.now();
        }
      }
    }
  }, 100); // Check every 100ms (was 300ms)
};

const stopTabataWatchdog = () => {
  if (tabataWatchdog) {
    clearInterval(tabataWatchdog);
    tabataWatchdog = null;
  }
  tabataShouldBePlaying = false;
};

export const playTabataSong = async () => {
  if (!tabataAudio) {
    tabataPlayerLoading = true;
    await createTabataAudioPlayer();
    tabataPlayerLoading = false;
  }

  if (tabataPlayerReady && tabataAudio) {
    try {
      tabataAudio.currentTime = TABATA_AUDIO_CONFIG.startTime;
      await tabataAudio.play();
      tabataPlaybackStartTime = Date.now();
      tabataShouldBePlaying = true;
      startTabataWatchdog();
      console.log('🎵 Playing Tabata song (watchdog enabled)');
    } catch (error) {
      console.error('Error playing Tabata audio:', error);
    }
  }
};

export const stopTabataSong = () => {
  if (tabataPlayerReady && tabataAudio) {
    try {
      stopTabataWatchdog();
      tabataAudio.pause();
      tabataAudio.currentTime = TABATA_AUDIO_CONFIG.startTime;
      console.log('⏹️ Stopping Tabata song');
    } catch (error) {
      console.error('Error stopping Tabata audio:', error);
    }
  }
};

export const pauseTabataSong = () => {
  if (tabataPlayerReady && tabataAudio) {
    try {
      stopTabataWatchdog();
      tabataAudio.pause();
      console.log('⏸️ Pausing Tabata song');
    } catch (error) {
      console.error('Error pausing Tabata audio:', error);
    }
  }
};

export const resumeTabataSong = () => {
  if (tabataPlayerReady && tabataAudio) {
    try {
      tabataAudio.play();
      tabataPlaybackStartTime = Date.now();
      tabataShouldBePlaying = true;
      startTabataWatchdog();
      console.log('▶️ Resuming Tabata song (watchdog enabled)');
    } catch (error) {
      console.error('Error resuming Tabata audio:', error);
    }
  }
};

// Get current Tabata audio position
export const getTabataAudioPosition = () => {
  if (tabataPlayerReady && tabataAudio) {
    return tabataAudio.currentTime;
  }
  return null;
};

// Set Tabata audio position
export const setTabataAudioPosition = (position) => {
  if (tabataPlayerReady && tabataAudio && position !== null && position >= 0) {
    try {
      tabataAudio.currentTime = position;
      console.log(`⏩ Setting Tabata audio position to ${position.toFixed(2)}s`);
      return true;
    } catch (error) {
      console.error('Error setting Tabata audio position:', error);
      return false;
    }
  }
  return false;
};

// Get Tabata audio player instance
export const getTabataAudioPlayer = () => tabataAudio;

// Check if Tabata audio is currently playing
export const isTabataAudioPlaying = () => {
  if (tabataPlayerReady && tabataAudio) {
    return !tabataAudio.paused;
  }
  return false;
};

// Check if we should ignore pause events (within 2 seconds of playback start)
export const shouldIgnoreTabataPause = () => {
  const timeSinceStart = Date.now() - tabataPlaybackStartTime;
  return timeSinceStart < 2000; // Ignore pauses within first 2 seconds
};

// ============ POMODORO AUDIO FUNCTIONS ============

let pomodoroAudio = null;

// Create and initialize Pomodoro audio player
const createPomodoroAudioPlayer = () => {
  return new Promise((resolve) => {
    if (!pomodoroAudio) {
      pomodoroAudio = new Audio(POMODORO_AUDIO_CONFIG.audioPath);
      pomodoroAudio.preload = 'auto';
      pomodoroAudio.loop = true; // Loop for continuous playback during work

      // Add attributes to prevent unwanted pausing on mobile browsers
      pomodoroAudio.setAttribute('playsinline', '');
      pomodoroAudio.setAttribute('webkit-playsinline', '');
      pomodoroAudio.setAttribute('disableRemotePlayback', '');
      pomodoroAudio.setAttribute('x-webkit-airplay', 'deny');

      // Set volume to ensure it's audible
      pomodoroAudio.volume = 0.7;

      // Prevent browser from auto-pausing due to inactivity
      pomodoroAudio.addEventListener('suspend', (e) => {
        console.log('🔇 Pomodoro audio suspend event', e);
        // Attempt to resume if we should be playing
        if (pomodoroShouldBePlaying) {
          setTimeout(() => {
            if (pomodoroAudio.paused && pomodoroShouldBePlaying) {
              console.log('🔄 Auto-resuming after suspend');
              pomodoroAudio.play().catch(err => console.error('Resume after suspend failed:', err));
            }
          }, 100);
        }
      });

      pomodoroAudio.addEventListener('stalled', (e) => {
        console.log('⚠️ Pomodoro audio stalled event', e);
      });

      pomodoroAudio.addEventListener('waiting', (e) => {
        console.log('⏳ Pomodoro audio waiting event', e);
      });

      pomodoroAudio.addEventListener('canplaythrough', () => {
        pomodoroPlayerReady = true;
        resolve(true);
      });

      pomodoroAudio.addEventListener('error', (error) => {
        console.error('Pomodoro audio loading error:', error);
        pomodoroPlayerReady = false;
        resolve(false);
      });

      pomodoroAudio.load();
    } else {
      resolve(pomodoroPlayerReady);
    }
  });
};

// Check if Pomodoro player is ready
export const isPomodoroPlayerReady = () => pomodoroPlayerReady;
export const isPomodoroPlayerLoading = () => pomodoroPlayerLoading;

// Initialize Pomodoro audio player
export const initializePomodoroAudioPlayer = async () => {
  if (!pomodoroAudio && !pomodoroPlayerLoading) {
    pomodoroPlayerLoading = true;
    const ready = await createPomodoroAudioPlayer();
    pomodoroPlayerLoading = false;
    return ready;
  }
  return pomodoroPlayerReady;
};

// Watchdog to detect and fix auto-pauses for Pomodoro
const startPomodoroWatchdog = () => {
  if (pomodoroWatchdog) clearInterval(pomodoroWatchdog);

  pomodoroWatchdog = setInterval(() => {
    if (pomodoroAudio && pomodoroPlayerReady && pomodoroShouldBePlaying) {
      if (pomodoroAudio.paused) {
        const timeSinceStart = Date.now() - pomodoroPlaybackStartTime;
        // Aggressive resume after 500ms (was 3000ms)
        if (timeSinceStart > 500) {
          console.log('⚠️ Pomodoro auto-pause detected! Resuming... (paused for', timeSinceStart, 'ms)');
          pomodoroAudio.play().catch(err => console.error('Auto-resume failed:', err));
          pomodoroPlaybackStartTime = Date.now();
        }
      }
    }
  }, 100); // Check every 100ms (was 300ms)
};

const stopPomodoroWatchdog = () => {
  if (pomodoroWatchdog) {
    clearInterval(pomodoroWatchdog);
    pomodoroWatchdog = null;
  }
  pomodoroShouldBePlaying = false;
};

export const playPomodoroSong = async () => {
  if (!pomodoroAudio) {
    pomodoroPlayerLoading = true;
    await createPomodoroAudioPlayer();
    pomodoroPlayerLoading = false;
  }

  if (pomodoroPlayerReady && pomodoroAudio) {
    try {
      pomodoroAudio.currentTime = POMODORO_AUDIO_CONFIG.startTime;
      await pomodoroAudio.play();
      pomodoroPlaybackStartTime = Date.now();
      pomodoroShouldBePlaying = true;
      startPomodoroWatchdog();
      console.log('🎵 Playing Pomodoro song (watchdog enabled)');
    } catch (error) {
      console.error('Error playing Pomodoro audio:', error);
    }
  }
};

export const stopPomodoroSong = () => {
  if (pomodoroPlayerReady && pomodoroAudio) {
    try {
      stopPomodoroWatchdog();
      pomodoroAudio.pause();
      pomodoroAudio.currentTime = POMODORO_AUDIO_CONFIG.startTime;
      console.log('⏹️ Stopping Pomodoro song');
    } catch (error) {
      console.error('Error stopping Pomodoro audio:', error);
    }
  }
};

export const pausePomodoroSong = () => {
  if (pomodoroPlayerReady && pomodoroAudio) {
    try {
      stopPomodoroWatchdog();
      pomodoroAudio.pause();
      console.log('⏸️ Pausing Pomodoro song');
    } catch (error) {
      console.error('Error pausing Pomodoro audio:', error);
    }
  }
};

export const resumePomodoroSong = () => {
  if (pomodoroPlayerReady && pomodoroAudio) {
    try {
      pomodoroAudio.play();
      pomodoroPlaybackStartTime = Date.now();
      pomodoroShouldBePlaying = true;
      startPomodoroWatchdog();
      console.log('▶️ Resuming Pomodoro song (watchdog enabled)');
    } catch (error) {
      console.error('Error resuming Pomodoro audio:', error);
    }
  }
};

// Get Pomodoro audio player instance
export const getPomodoroAudioPlayer = () => pomodoroAudio;

// Check if Pomodoro audio is currently playing
export const isPomodoroAudioPlaying = () => {
  if (pomodoroPlayerReady && pomodoroAudio) {
    return !pomodoroAudio.paused;
  }
  return false;
};

// Check if we should ignore pause events (within 2 seconds of playback start)
export const shouldIgnorePomodoroPause = () => {
  const timeSinceStart = Date.now() - pomodoroPlaybackStartTime;
  return timeSinceStart < 2000; // Ignore pauses within first 2 seconds
};

// ============ BEEP SOUNDS ============

// Play a beep sound
export const playBeep = (frequency = 800, duration = 150, volume = 0.3) => {
  const ctx = initAudioContext();
  if (!ctx) return;

  // Resume context if needed (for user interaction requirement)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration / 1000);
};

// Play work start sound (higher pitched energetic beep)
export const playWorkSound = () => {
  playBeep(1000, 200, 0.4);
};

// Play countdown sound (3-2-1 pattern)
export const playCountdownSound = (count) => {
  const frequencies = { 3: 600, 2: 700, 1: 800 };
  const frequency = frequencies[count] || 500;
  playBeep(frequency, 300, 0.35);
};

// Play preparation sound (gentle beep)
export const playPrepSound = () => {
  playBeep(500, 100, 0.25);
};

// ============ VISIBILITY CHANGE HANDLER ============

// Aggressively resume audio when tab becomes visible again
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('📱 Tab became visible');

      // Resume HIIT if it should be playing
      if (hiitAudio && hiitShouldBePlaying && hiitAudio.paused) {
        console.log('🔄 Resuming HIIT audio after visibility change');
        hiitAudio.play().catch(err => console.error('Failed to resume HIIT:', err));
      }

      // Resume Tabata if it should be playing
      if (tabataAudio && tabataShouldBePlaying && tabataAudio.paused) {
        console.log('🔄 Resuming Tabata audio after visibility change');
        tabataAudio.play().catch(err => console.error('Failed to resume Tabata:', err));
      }

      // Resume Pomodoro if it should be playing
      if (pomodoroAudio && pomodoroShouldBePlaying && pomodoroAudio.paused) {
        console.log('🔄 Resuming Pomodoro audio after visibility change');
        pomodoroAudio.play().catch(err => console.error('Failed to resume Pomodoro:', err));
      }
    }
  });
}
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
  audioPath: '/hiit_next-level_40-20.mp3',
  startTime: 1.37, // seconds - matches preparation time in config
  url: '/hiit_next-level_40-20.mp3'
};

// Local MP3 configuration for Tabata workout
export const TABATA_AUDIO_CONFIG = {
  audioPath: '/tabata_rocky_20-10_x4.mp3',
  startTime: 0, // seconds - start from beginning after preparation
  url: '/tabata_rocky_20-10_x4.mp3'
};

// Audio player state
let audioPlayerReady = false;
let audioPlayerLoading = false;
let tabataPlayerReady = false;
let tabataPlayerLoading = false;

// Create and initialize local audio player
const createAudioPlayer = () => {
  return new Promise((resolve) => {
    if (!hiitAudio) {
      hiitAudio = new Audio(HIIT_AUDIO_CONFIG.audioPath);
      hiitAudio.preload = 'auto';
      
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

export const playHiitSong = async () => {
  if (!hiitAudio) {
    audioPlayerLoading = true;
    await createAudioPlayer();
    audioPlayerLoading = false;
  }
  
  if (audioPlayerReady && hiitAudio) {
    try {
      hiitAudio.currentTime = HIIT_AUDIO_CONFIG.startTime;
      hiitAudio.play();
      console.log('🎵 Playing HIIT song');
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }
};

export const stopHiitSong = () => {
  if (audioPlayerReady && hiitAudio) {
    try {
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
      console.log('▶️ Resuming HIIT song');
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

// ============ TABATA AUDIO FUNCTIONS ============

// Create and initialize Tabata audio player
const createTabataAudioPlayer = () => {
  return new Promise((resolve) => {
    if (!tabataAudio) {
      tabataAudio = new Audio(TABATA_AUDIO_CONFIG.audioPath);
      tabataAudio.preload = 'auto';

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

export const playTabataSong = async () => {
  if (!tabataAudio) {
    tabataPlayerLoading = true;
    await createTabataAudioPlayer();
    tabataPlayerLoading = false;
  }

  if (tabataPlayerReady && tabataAudio) {
    try {
      tabataAudio.currentTime = TABATA_AUDIO_CONFIG.startTime;
      tabataAudio.play();
      console.log('🎵 Playing Tabata song');
    } catch (error) {
      console.error('Error playing Tabata audio:', error);
    }
  }
};

export const stopTabataSong = () => {
  if (tabataPlayerReady && tabataAudio) {
    try {
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
      console.log('▶️ Resuming Tabata song');
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
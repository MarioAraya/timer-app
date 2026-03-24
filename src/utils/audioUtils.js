// Audio utilities for timer sounds
import WorkoutAudioPlayer from './WorkoutAudioPlayer'

let audioContext;

// Initialize audio context if available
const initAudioContext = () => {
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// ============ AUDIO CONFIGURATIONS ============

export const HIIT_AUDIO_CONFIG = {
  name: 'HIIT',
  audioPath: '/hiit_next-level_40-20_x12.mp3',
  startTime: 1.37,
  url: '/hiit_next-level_40-20.mp3',
  defaultVolume: 0.7,
  loop: false
};

export const TABATA_AUDIO_CONFIG = {
  name: 'Tabata',
  audioPath: '/tabata_rocky_20-10_x4.mp3',
  startTime: 0,
  url: '/tabata_rocky_20-10_x4.mp3',
  defaultVolume: 0.7,
  loop: false
};

export const POMODORO_AUDIO_CONFIG = {
  name: 'Pomodoro',
  audioPath: '/lofi_morning_routine-chosic.com.mp3',
  startTime: 0,
  url: '/lofi_morning_routine-chosic.com.mp3',
  defaultVolume: 0.7,
  loop: true
};

// ============ AUDIO PLAYER INSTANCES ============

const hiitPlayer = new WorkoutAudioPlayer(HIIT_AUDIO_CONFIG);
const tabataPlayer = new WorkoutAudioPlayer(TABATA_AUDIO_CONFIG);
const pomodoroPlayer = new WorkoutAudioPlayer(POMODORO_AUDIO_CONFIG);

// ============ HIIT AUDIO FUNCTIONS (Backward Compatible) ============

export const isPlayerReady = () => hiitPlayer.isReady();
export const isPlayerLoading = () => hiitPlayer.isLoading();
export const initializeAudioPlayer = () => hiitPlayer.initialize();
export const playHiitSong = () => hiitPlayer.play();
export const stopHiitSong = () => hiitPlayer.stop();
export const pauseHiitSong = () => hiitPlayer.pause();
export const resumeHiitSong = () => hiitPlayer.resume();
export const getAudioPosition = () => hiitPlayer.getPosition();
export const setAudioPosition = (position) => hiitPlayer.setPosition(position);
export const getAudioPlayer = () => hiitPlayer.getPlayer();
export const isAudioPlaying = () => hiitPlayer.isPlaying();
export const shouldIgnoreHiitPause = () => hiitPlayer.shouldIgnorePause();

// ============ TABATA AUDIO FUNCTIONS (Backward Compatible) ============

export const isTabataPlayerReady = () => tabataPlayer.isReady();
export const isTabataPlayerLoading = () => tabataPlayer.isLoading();
export const initializeTabataAudioPlayer = () => tabataPlayer.initialize();
export const playTabataSong = () => tabataPlayer.play();
export const stopTabataSong = () => tabataPlayer.stop();
export const pauseTabataSong = () => tabataPlayer.pause();
export const resumeTabataSong = () => tabataPlayer.resume();
export const getTabataAudioPosition = () => tabataPlayer.getPosition();
export const setTabataAudioPosition = (position) => tabataPlayer.setPosition(position);
export const getTabataAudioPlayer = () => tabataPlayer.getPlayer();
export const isTabataAudioPlaying = () => tabataPlayer.isPlaying();
export const shouldIgnoreTabataPause = () => tabataPlayer.shouldIgnorePause();

// ============ POMODORO AUDIO FUNCTIONS (Backward Compatible) ============

export const isPomodoroPlayerReady = () => pomodoroPlayer.isReady();
export const isPomodoroPlayerLoading = () => pomodoroPlayer.isLoading();
export const initializePomodoroAudioPlayer = () => pomodoroPlayer.initialize();
export const playPomodoroSong = () => pomodoroPlayer.play();
export const stopPomodoroSong = () => pomodoroPlayer.stop();
export const pausePomodoroSong = () => pomodoroPlayer.pause();
export const resumePomodoroSong = () => pomodoroPlayer.resume();
export const getPomodoroAudioPlayer = () => pomodoroPlayer.getPlayer();
export const isPomodoroAudioPlaying = () => pomodoroPlayer.isPlaying();
export const shouldIgnorePomodoroPause = () => pomodoroPlayer.shouldIgnorePause();

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
      const hiitAudio = hiitPlayer.getPlayer();
      if (hiitAudio && hiitPlayer.shouldBePlaying && hiitAudio.paused) {
        console.log('🔄 Resuming HIIT audio after visibility change');
        hiitAudio.play().catch(err => console.error('Failed to resume HIIT:', err));
      }

      // Resume Tabata if it should be playing
      const tabataAudio = tabataPlayer.getPlayer();
      if (tabataAudio && tabataPlayer.shouldBePlaying && tabataAudio.paused) {
        console.log('🔄 Resuming Tabata audio after visibility change');
        tabataAudio.play().catch(err => console.error('Failed to resume Tabata:', err));
      }

      // Resume Pomodoro if it should be playing
      const pomodoroAudio = pomodoroPlayer.getPlayer();
      if (pomodoroAudio && pomodoroPlayer.shouldBePlaying && pomodoroAudio.paused) {
        console.log('🔄 Resuming Pomodoro audio after visibility change');
        pomodoroAudio.play().catch(err => console.error('Failed to resume Pomodoro:', err));
      }
    }
  });
}

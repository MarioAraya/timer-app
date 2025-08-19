// Audio utilities for timer sounds
let audioContext;
let hiitAudio = null;

// Initialize audio context if available
const initAudioContext = () => {
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// YouTube video configuration for HIIT workout
export const HIIT_YOUTUBE_CONFIG = {
  videoId: 'XZl8PfoP9ag',
  startTime: 1,
  url: 'https://www.youtube.com/watch?v=XZl8PfoP9ag&t=1s'
};

// YouTube player instance (will be initialized when needed)
let youtubePlayer = null;
let playerReady = false;
let playerLoading = false;

// Create hidden YouTube iframe for audio-only playback
const createYouTubePlayer = () => {
  return new Promise((resolve) => {
    // Create container for the player (hidden)
    let playerContainer = document.getElementById('youtube-player-container');
    if (!playerContainer) {
      playerContainer = document.createElement('div');
      playerContainer.id = 'youtube-player-container';
      playerContainer.style.cssText = `
        position: fixed;
        top: -1000px;
        left: -1000px;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
        z-index: -1;
      `;
      document.body.appendChild(playerContainer);
    }

    // Load YouTube Player API if not already loaded
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onload = () => {
        window.onYouTubeIframeAPIReady = () => {
          initializePlayer(resolve);
        };
      };
      document.head.appendChild(script);
    } else if (window.YT.Player) {
      initializePlayer(resolve);
    }
  });
};

const initializePlayer = (resolve) => {
  youtubePlayer = new window.YT.Player('youtube-player-container', {
    height: '1',
    width: '1',
    videoId: HIIT_YOUTUBE_CONFIG.videoId,
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      start: HIIT_YOUTUBE_CONFIG.startTime
    },
    events: {
      onReady: () => {
        playerReady = true;
        resolve();
      },
      onError: (error) => {
        console.error('YouTube player error:', error);
        resolve(); // Continue even if there's an error
      }
    }
  });
};

// Check if YouTube player is ready
export const isPlayerReady = () => playerReady;
export const isPlayerLoading = () => playerLoading;

// Initialize YouTube player (call this early)
export const initializeYouTubePlayer = async () => {
  if (!youtubePlayer && !playerLoading) {
    playerLoading = true;
    await createYouTubePlayer();
    playerLoading = false;
  }
  return playerReady;
};

export const playHiitSong = async () => {
  if (!youtubePlayer) {
    playerLoading = true;
    await createYouTubePlayer();
    playerLoading = false;
  }
  
  if (playerReady && youtubePlayer) {
    try {
      youtubePlayer.seekTo(HIIT_YOUTUBE_CONFIG.startTime, true);
      youtubePlayer.playVideo();
      console.log('🎵 Playing HIIT song');
    } catch (error) {
      console.error('Error playing YouTube video:', error);
    }
  }
};

export const stopHiitSong = () => {
  if (playerReady && youtubePlayer) {
    try {
      youtubePlayer.stopVideo();
      console.log('⏹️ Stopping HIIT song');
    } catch (error) {
      console.error('Error stopping YouTube video:', error);
    }
  }
};

export const pauseHiitSong = () => {
  if (playerReady && youtubePlayer) {
    try {
      youtubePlayer.pauseVideo();
      console.log('⏸️ Pausing HIIT song');
    } catch (error) {
      console.error('Error pausing YouTube video:', error);
    }
  }
};

export const resumeHiitSong = () => {
  if (playerReady && youtubePlayer) {
    try {
      youtubePlayer.playVideo();
      console.log('▶️ Resuming HIIT song');
    } catch (error) {
      console.error('Error resuming YouTube video:', error);
    }
  }
};

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
// Pomodoro Timer Configuration
// Classic Pomodoro Technique: 25min work, 5min break, long break after 4 sessions

export const POMODORO_CONFIG = {
  // Work session duration (in seconds)
  workDuration: 25 * 60, // 25 minutes

  // Short break duration (in seconds)
  shortBreakDuration: 5 * 60, // 5 minutes

  // Long break duration (in seconds)
  longBreakDuration: 15 * 60, // 15 minutes

  // Number of work sessions before a long break
  sessionsBeforeLongBreak: 4,

  // Phase messages
  messages: {
    work: "💼 Focus Time!",
    shortBreak: "☕ Short Break",
    longBreak: "🎉 Long Break - Well Done!",
    preparation: "🍅 Ready to focus?"
  },

  // Phase subtitles
  subtitles: {
    work: "Stay focused, you've got this!",
    shortBreak: "Take a quick breather",
    longBreak: "You've earned it! Relax and recharge.",
    preparation: "Get ready for your next Pomodoro session"
  }
}

// Helper function to calculate session time display
export const formatSessionInfo = (sessionNumber, isWorkPhase) => {
  const sessionInCycle = ((sessionNumber - 1) % POMODORO_CONFIG.sessionsBeforeLongBreak) + 1

  if (isWorkPhase) {
    return `Session ${sessionNumber} (${sessionInCycle}/${POMODORO_CONFIG.sessionsBeforeLongBreak})`
  }

  const isLongBreak = sessionNumber % POMODORO_CONFIG.sessionsBeforeLongBreak === 0
  return isLongBreak ? 'Long Break' : 'Short Break'
}

// Helper to determine break type
export const getBreakDuration = (sessionNumber) => {
  const isLongBreak = sessionNumber % POMODORO_CONFIG.sessionsBeforeLongBreak === 0
  return isLongBreak
    ? POMODORO_CONFIG.longBreakDuration
    : POMODORO_CONFIG.shortBreakDuration
}

// Helper to get phase message
export const getPhaseMessage = (isWorkPhase, sessionNumber) => {
  if (isWorkPhase) {
    return POMODORO_CONFIG.messages.work
  }

  const isLongBreak = sessionNumber % POMODORO_CONFIG.sessionsBeforeLongBreak === 0
  return isLongBreak
    ? POMODORO_CONFIG.messages.longBreak
    : POMODORO_CONFIG.messages.shortBreak
}

// Helper to get phase subtitle
export const getPhaseSubtitle = (isWorkPhase, sessionNumber) => {
  if (isWorkPhase) {
    return POMODORO_CONFIG.subtitles.work
  }

  const isLongBreak = sessionNumber % POMODORO_CONFIG.sessionsBeforeLongBreak === 0
  return isLongBreak
    ? POMODORO_CONFIG.subtitles.longBreak
    : POMODORO_CONFIG.subtitles.shortBreak
}

// Export variations for different preferences
export const POMODORO_VARIATIONS = {
  // Classic Pomodoro (25-5-15)
  classic: POMODORO_CONFIG,

  // Short sessions for beginners (15-3-10)
  short: {
    workDuration: 15 * 60,
    shortBreakDuration: 3 * 60,
    longBreakDuration: 10 * 60,
    sessionsBeforeLongBreak: 4,
    messages: POMODORO_CONFIG.messages,
    subtitles: POMODORO_CONFIG.subtitles
  },

  // Extended focus (50-10-30)
  extended: {
    workDuration: 50 * 60,
    shortBreakDuration: 10 * 60,
    longBreakDuration: 30 * 60,
    sessionsBeforeLongBreak: 4,
    messages: POMODORO_CONFIG.messages,
    subtitles: POMODORO_CONFIG.subtitles
  }
}

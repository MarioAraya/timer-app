// Pomodoro Timer Configuration
// Classic Pomodoro Technique: 25min work, 5min break, long break after 4 sessions

// Messages/subtitles are i18n dot-keys resolved with t() at render time
const SHARED_MESSAGES = {
  work: 'pomodoro.messages.work',
  shortBreak: 'pomodoro.messages.shortBreak',
  longBreak: 'pomodoro.messages.longBreak',
  preparation: 'pomodoro.messages.preparation'
}

const SHARED_SUBTITLES = {
  work: 'pomodoro.subtitles.work',
  shortBreak: 'pomodoro.subtitles.shortBreak',
  longBreak: 'pomodoro.subtitles.longBreak',
  preparation: 'pomodoro.subtitles.preparation'
}

export const POMODORO_CONFIG = {
  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
  messages: SHARED_MESSAGES,
  subtitles: SHARED_SUBTITLES
}

export const POMODORO_PRESETS = [
  { id: 'baby',     workDuration: 10 * 60, shortBreakDuration: 5 * 60,  longBreakDuration: 10 * 60, sessionsBeforeLongBreak: 4, messages: SHARED_MESSAGES, subtitles: SHARED_SUBTITLES },
  { id: 'popular',  workDuration: 20 * 60, shortBreakDuration: 5 * 60,  longBreakDuration: 15 * 60, sessionsBeforeLongBreak: 4, messages: SHARED_MESSAGES, subtitles: SHARED_SUBTITLES },
  { id: 'medium',   workDuration: 40 * 60, shortBreakDuration: 8 * 60,  longBreakDuration: 20 * 60, sessionsBeforeLongBreak: 4, messages: SHARED_MESSAGES, subtitles: SHARED_SUBTITLES },
  { id: 'extended', workDuration: 60 * 60, shortBreakDuration: 10 * 60, longBreakDuration: 25 * 60, sessionsBeforeLongBreak: 4, messages: SHARED_MESSAGES, subtitles: SHARED_SUBTITLES },
  { id: 'custom',   workDuration: 15 * 60, shortBreakDuration: 8 * 60,  longBreakDuration: 10 * 60, sessionsBeforeLongBreak: 4, messages: SHARED_MESSAGES, subtitles: SHARED_SUBTITLES },
]

// Helper to determine break type (accepts optional config, falls back to default)
export const getBreakDuration = (sessionNumber, config = POMODORO_CONFIG) => {
  const isLongBreak = sessionNumber % config.sessionsBeforeLongBreak === 0
  return isLongBreak ? config.longBreakDuration : config.shortBreakDuration
}

export const getPhaseMessage = (isWorkPhase, sessionNumber, config = POMODORO_CONFIG) => {
  if (isWorkPhase) return config.messages.work
  const isLongBreak = sessionNumber % config.sessionsBeforeLongBreak === 0
  return isLongBreak ? config.messages.longBreak : config.messages.shortBreak
}

export const getPhaseSubtitle = (isWorkPhase, sessionNumber, config = POMODORO_CONFIG) => {
  if (isWorkPhase) return config.subtitles.work
  const isLongBreak = sessionNumber % config.sessionsBeforeLongBreak === 0
  return isLongBreak ? config.subtitles.longBreak : config.subtitles.shortBreak
}

export const formatSessionInfo = (sessionNumber, isWorkPhase, config = POMODORO_CONFIG) => {
  const sessionInCycle = ((sessionNumber - 1) % config.sessionsBeforeLongBreak) + 1
  if (isWorkPhase) return `Session ${sessionNumber} (${sessionInCycle}/${config.sessionsBeforeLongBreak})`
  const isLongBreak = sessionNumber % config.sessionsBeforeLongBreak === 0
  return isLongBreak ? 'Long Break' : 'Short Break'
}

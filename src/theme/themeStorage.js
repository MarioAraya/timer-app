import { VALID_THEMES, DEFAULT_THEME } from './index'

const STORAGE_KEY = 'timer-app-theme'

export function loadTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (VALID_THEMES.includes(stored)) return stored
  } catch {
    // localStorage unavailable (private mode / SSR) — fall through to default
  }
  return DEFAULT_THEME
}

export function saveTheme(theme) {
  if (!VALID_THEMES.includes(theme)) return
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore quota / disabled storage
  }
}

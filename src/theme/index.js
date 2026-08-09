export const VALID_THEMES = ['dark', 'light', 'green']

export const DEFAULT_THEME = 'dark'

// Order used by the header toggle when cycling.
export const THEME_CYCLE = VALID_THEMES

export function nextTheme(theme) {
  const i = THEME_CYCLE.indexOf(theme)
  return THEME_CYCLE[(i + 1) % THEME_CYCLE.length]
}

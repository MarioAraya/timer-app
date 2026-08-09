import { useState, useCallback, useEffect } from 'preact/hooks'
import { VALID_THEMES, nextTheme as computeNext } from '../theme/index'
import { loadTheme, saveTheme } from '../theme/themeStorage'

export function useTheme() {
  const [theme, setThemeState] = useState(() => loadTheme())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = useCallback((newTheme) => {
    if (!VALID_THEMES.includes(newTheme)) return
    saveTheme(newTheme)
    setThemeState(newTheme)
  }, [])

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = computeNext(current)
      saveTheme(next)
      return next
    })
  }, [])

  return { theme, setTheme, cycleTheme, themes: VALID_THEMES }
}

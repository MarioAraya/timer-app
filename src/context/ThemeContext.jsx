import { createContext } from 'preact'
import { useContext } from 'preact/hooks'
import { useTheme } from '../hooks/useTheme'

export const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const theme = useTheme()
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeCtx() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeCtx must be used inside ThemeProvider')
  return ctx
}

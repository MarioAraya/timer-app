import { createContext } from 'preact'
import { useContext } from 'preact/hooks'
import { useLanguage } from '../hooks/useLanguage'

export const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const lang = useLanguage()
  return (
    <LanguageContext.Provider value={lang}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider')
  return ctx
}

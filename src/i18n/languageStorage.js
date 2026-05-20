import { VALID_LANGS } from './index'

const STORAGE_KEY = 'timer-app-lang'

function detectBrowserLang() {
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || '']
  for (const l of langs) {
    if (l.toLowerCase().startsWith('es')) return 'es'
  }
  return 'en'
}

export function loadLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (VALID_LANGS.includes(stored)) return stored
  return detectBrowserLang()
}

export function saveLanguage(lang) {
  if (!VALID_LANGS.includes(lang)) return
  localStorage.setItem(STORAGE_KEY, lang)
}

import { DEFAULT_LANG, VALID_LANGS } from './index'

const STORAGE_KEY = 'timer-app-lang'

export function loadLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY)
  return VALID_LANGS.includes(stored) ? stored : DEFAULT_LANG
}

export function saveLanguage(lang) {
  if (!VALID_LANGS.includes(lang)) return
  localStorage.setItem(STORAGE_KEY, lang)
}

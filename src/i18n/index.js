import es from './es'
import en from './en'

export const DEFAULT_LANG = 'en'
export const VALID_LANGS = ['es', 'en']

export const translations = { es, en }

/**
 * Resolve a dot-notation key from a translations object.
 * Returns the key itself as fallback if not found.
 */
export function t(lang, key) {
  const dict = translations[VALID_LANGS.includes(lang) ? lang : DEFAULT_LANG]
  if (!key) return key
  const parts = key.split('.')
  let cur = dict
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return key
    cur = cur[part]
  }
  return (cur != null && typeof cur !== 'object') ? cur : key
}

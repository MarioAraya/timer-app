import { useState, useCallback } from 'preact/hooks'
import { t as translate, VALID_LANGS } from '../i18n/index'
import { loadLanguage, saveLanguage } from '../i18n/languageStorage'

export function useLanguage() {
  const [lang, setLangState] = useState(() => loadLanguage())

  const setLang = useCallback((newLang) => {
    if (!VALID_LANGS.includes(newLang)) return
    saveLanguage(newLang)
    setLangState(newLang)
  }, [])

  const t = useCallback((key) => translate(lang, key), [lang])

  return { lang, setLang, t }
}

import { render } from '@testing-library/preact'
import { LanguageContext } from '../context/LanguageContext'
import { t as translate } from '../i18n/index'

export function renderWithLang(ui, { lang = 'es' } = {}) {
  const t = (key) => translate(lang, key)
  const setLang = () => {}
  const ctx = { lang, t, setLang }

  return render(
    <LanguageContext.Provider value={ctx}>
      {ui}
    </LanguageContext.Provider>
  )
}

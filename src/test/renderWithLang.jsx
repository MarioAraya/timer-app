import { render } from '@testing-library/preact'
import { LanguageContext } from '../context/LanguageContext'
import { ThemeContext } from '../context/ThemeContext'
import { t as translate } from '../i18n/index'
import { VALID_THEMES } from '../theme/index'

export function renderWithLang(ui, { lang = 'es', theme = 'dark' } = {}) {
  const t = (key) => translate(lang, key)
  const setLang = () => {}
  const ctx = { lang, t, setLang }
  const themeCtx = { theme, setTheme: () => {}, cycleTheme: () => {}, themes: VALID_THEMES }

  return render(
    <ThemeContext.Provider value={themeCtx}>
      <LanguageContext.Provider value={ctx}>
        {ui}
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  )
}

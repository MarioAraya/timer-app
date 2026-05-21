// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/preact'
import { LanguageContext } from '../context/LanguageContext'
import { t as translate } from '../i18n/index'
import TimersHome from './TimersHome'

afterEach(cleanup)

// localStorage mock — evita colisión con otros tests
const makeStorage = () => {
  const store = new Map()
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
}
beforeEach(() => { global.localStorage = makeStorage() })

function makeCtx(lang, setLang = vi.fn()) {
  return { lang, t: (key) => translate(lang, key), setLang }
}

function renderHome(lang = 'es', props = {}) {
  const defaults = {
    onTimerSelect: vi.fn(),
    activeTimer: null,
    session: null,
    onAuthClick: vi.fn(),
    onSignOut: vi.fn(),
  }
  return render(
    <LanguageContext.Provider value={makeCtx(lang)}>
      <TimersHome {...defaults} {...props} />
    </LanguageContext.Provider>
  )
}

// ─────────────────────────────────────────────────────
// Cards renderizadas en ES
// ─────────────────────────────────────────────────────

describe('TimersHome — cards en español (default)', () => {
  it('muestra card de HIIT con título correcto', () => {
    renderHome('es')
    expect(screen.getByText('Entrenamiento HIIT')).toBeTruthy()
  })

  it('muestra card de Tabata con título correcto', () => {
    renderHome('es')
    expect(screen.getByText('Protocolo Tabata')).toBeTruthy()
  })

  it('muestra card de Pomodoro con título correcto', () => {
    renderHome('es')
    expect(screen.getByText('Temporizador Pomodoro')).toBeTruthy()
  })

  it('muestra card de Respiración Cuadrada', () => {
    renderHome('es')
    expect(screen.getByText('Respiración Cuadrada')).toBeTruthy()
  })

  it('muestra card de Wim Hof', () => {
    renderHome('es')
    expect(screen.getAllByText('Wim Hof').length).toBeGreaterThan(0)
  })

  it('muestra 7 cards en total', () => {
    renderHome('es')
    const cards = document.querySelectorAll('[data-testid^="timer-card-"]')
    expect(cards.length).toBe(7)
  })

  it('categorías en español: Bienestar visible', () => {
    renderHome('es')
    const bienestar = screen.getAllByText('Bienestar')
    expect(bienestar.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────
// Cards renderizadas en EN
// ─────────────────────────────────────────────────────

describe('TimersHome — cards en inglés', () => {
  it('muestra "HIIT Workout" en inglés', () => {
    renderHome('en')
    expect(screen.getByText('HIIT Workout')).toBeTruthy()
  })

  it('muestra "Tabata Protocol" en inglés', () => {
    renderHome('en')
    expect(screen.getByText('Tabata Protocol')).toBeTruthy()
  })

  it('muestra "Pomodoro Timer" en inglés', () => {
    renderHome('en')
    expect(screen.getByText('Pomodoro Timer')).toBeTruthy()
  })

  it('muestra "Wellness" en inglés (no "Bienestar")', () => {
    renderHome('en')
    expect(screen.getAllByText('Wellness').length).toBeGreaterThan(0)
    expect(screen.queryByText('Bienestar')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────
// Toggle de idioma
// ─────────────────────────────────────────────────────

describe('TimersHome — toggle de idioma', () => {
  it('botón de toggle muestra "ES" cuando lang=es', () => {
    renderHome('es')
    expect(screen.getByText('ES')).toBeTruthy()
  })

  it('botón de toggle muestra "EN" cuando lang=en', () => {
    renderHome('en')
    expect(screen.getByText('EN')).toBeTruthy()
  })

  it('click en toggle llama setLang con el idioma opuesto (es → en)', () => {
    const setLang = vi.fn()
    render(
      <LanguageContext.Provider value={{ lang: 'es', t: (k) => translate('es', k), setLang }}>
        <TimersHome onTimerSelect={vi.fn()} activeTimer={null} session={null} onAuthClick={vi.fn()} onSignOut={vi.fn()} />
      </LanguageContext.Provider>
    )
    fireEvent.click(screen.getByText('ES'))
    expect(setLang).toHaveBeenCalledWith('en')
  })

  it('click en toggle llama setLang con el idioma opuesto (en → es)', () => {
    const setLang = vi.fn()
    render(
      <LanguageContext.Provider value={{ lang: 'en', t: (k) => translate('en', k), setLang }}>
        <TimersHome onTimerSelect={vi.fn()} activeTimer={null} session={null} onAuthClick={vi.fn()} onSignOut={vi.fn()} />
      </LanguageContext.Provider>
    )
    fireEvent.click(screen.getByText('EN'))
    expect(setLang).toHaveBeenCalledWith('es')
  })
})

// ─────────────────────────────────────────────────────
// Click en card
// ─────────────────────────────────────────────────────

describe('TimersHome — selección de timer', () => {
  it('click en card HIIT llama onTimerSelect', () => {
    const onTimerSelect = vi.fn()
    renderHome('es', { onTimerSelect })
    fireEvent.click(document.querySelector('[data-testid="timer-card-hiit"]'))
    expect(onTimerSelect).toHaveBeenCalledOnce()
  })

  it('onTimerSelect recibe objeto con component HiitTimer', () => {
    const onTimerSelect = vi.fn()
    renderHome('es', { onTimerSelect })
    fireEvent.click(document.querySelector('[data-testid="timer-card-hiit"]'))
    expect(onTimerSelect.mock.calls[0][0].component).toBe('HiitTimer')
  })
})

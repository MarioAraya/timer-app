// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/preact'
import { LanguageContext } from '../../context/LanguageContext'
import { t as translate } from '../../i18n/index'
import PomodoroSetupView from './PomodoroSetupView'

afterEach(cleanup)

function makeCtx(lang = 'es') {
  return { lang, t: (key) => translate(lang, key), setLang: () => {} }
}

function renderSetup(lang = 'es', props = {}) {
  return render(
    <LanguageContext.Provider value={makeCtx(lang)}>
      <PomodoroSetupView onStart={vi.fn()} {...props} />
    </LanguageContext.Provider>
  )
}

// ─────────────────────────────────────────────────────
// Presets — render y selección
// ─────────────────────────────────────────────────────

describe('PomodoroSetupView — presets en ES', () => {
  it('muestra los 5 presets', () => {
    renderSetup()
    expect(screen.getByText('Paso de bebé')).toBeTruthy()
    expect(screen.getByText('Popular')).toBeTruthy()
    expect(screen.getByText('Medio')).toBeTruthy()
    expect(screen.getByText('Extendido')).toBeTruthy()
    expect(screen.getByText('Personalizado')).toBeTruthy()
  })

  it('"popular" está seleccionado por defecto', () => {
    renderSetup()
    const popularRow = screen.getByText('Popular').closest('.psetup-preset-row')
    expect(popularRow.className).toContain('selected')
  })

  it('click en "Medio" lo marca como selected', () => {
    renderSetup()
    fireEvent.click(screen.getByText('Medio'))
    const medioRow = screen.getByText('Medio').closest('.psetup-preset-row')
    expect(medioRow.className).toContain('selected')
  })

  it('click en "Personalizado" muestra sliders de custom', () => {
    renderSetup()
    fireEvent.click(screen.getByText('Personalizado'))
    expect(document.querySelector('.psetup-custom-sliders')).toBeTruthy()
  })

  it('sliders custom NO visibles con preset "popular"', () => {
    renderSetup()
    expect(document.querySelector('.psetup-custom-sliders')).toBeNull()
  })
})

describe('PomodoroSetupView — presets en EN', () => {
  it('muestra los 5 presets en inglés', () => {
    renderSetup('en')
    expect(screen.getByText('Baby Steps')).toBeTruthy()
    expect(screen.getByText('Medium')).toBeTruthy()
    expect(screen.getByText('Extended')).toBeTruthy()
    expect(screen.getByText('Custom')).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────
// onStart callback — recibe config correcta
// ─────────────────────────────────────────────────────

describe('PomodoroSetupView — onStart callback', () => {
  it('start con preset popular llama onStart con workDuration=20min', () => {
    const onStart = vi.fn()
    renderSetup('es', { onStart })
    fireEvent.click(document.querySelector('[data-testid="pomodoro-setup-start"]'))
    expect(onStart).toHaveBeenCalledOnce()
    const config = onStart.mock.calls[0][0]
    expect(config.id).toBe('popular')
    expect(config.workDuration).toBe(20 * 60)
  })

  it('start con preset custom pasa durations personalizadas', () => {
    const onStart = vi.fn()
    renderSetup('es', { onStart })
    fireEvent.click(screen.getByText('Personalizado'))
    // Valores default custom: 15 work, 8 short, 10 long
    fireEvent.click(document.querySelector('[data-testid="pomodoro-setup-start"]'))
    const config = onStart.mock.calls[0][0]
    expect(config.workDuration).toBe(15 * 60)
    expect(config.shortBreakDuration).toBe(8 * 60)
  })
})

// ─────────────────────────────────────────────────────
// i18n — título y botón usan t()
// ─────────────────────────────────────────────────────

describe('PomodoroSetupView — i18n title y botón', () => {
  it('título en ES', () => {
    renderSetup('es')
    expect(screen.getByText('Pomodoro')).toBeTruthy()
  })

  it('botón start muestra "INICIAR" en ES', () => {
    renderSetup('es')
    const btn = document.querySelector('[data-testid="pomodoro-setup-start"]')
    expect(btn.textContent).toContain('INICIAR')
  })

  it('botón start muestra "START WORKOUT" en EN', () => {
    renderSetup('en')
    const btn = document.querySelector('[data-testid="pomodoro-setup-start"]')
    expect(btn.textContent).toContain('START WORKOUT')
  })
})

// ─────────────────────────────────────────────────────
// i18n — claves de audio Pomodoro (sin DOM — validación directa)
// ─────────────────────────────────────────────────────

describe('Pomodoro audio i18n keys', () => {
  const audioKeys = [
    'pomodoro.audio.lofi',
    'pomodoro.audio.beeps',
    'pomodoro.audio.loading',
    'pomodoro.audio.pauseMusic',
    'pomodoro.audio.playMusic',
    'pomodoro.audio.repeatTrack',
    'pomodoro.audio.nextTrack',
  ]

  for (const key of audioKeys) {
    it(`${key} en ES ≠ clave (existe traducción)`, () => {
      expect(translate('es', key)).not.toBe(key)
    })

    it(`${key} en EN ≠ clave (existe traducción)`, () => {
      expect(translate('en', key)).not.toBe(key)
    })
  }
})

// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/preact'

afterEach(cleanup)
import { LanguageContext } from '../../context/LanguageContext'
import { t as translate } from '../../i18n/index'
import TimerControls from './TimerControls'

function makeCtx(lang = 'es') {
  return { lang, t: (key) => translate(lang, key), setLang: () => {} }
}

function renderControls(props, lang = 'es') {
  const defaults = {
    isRunning: false,
    isFinished: false,
    isPreparationPhase: true,
    timeLeft: 10,
    preparationTime: 10,
    musicMode: false,
    playerStatus: 'ready',
    hasStarted: false,
    showSkipButton: false,
    handleStart: vi.fn(),
    handlePause: vi.fn(),
    handleSkip: vi.fn(),
    handleReset: vi.fn(),
  }
  return render(
    <LanguageContext.Provider value={makeCtx(lang)}>
      <TimerControls {...defaults} {...props} />
    </LanguageContext.Provider>
  )
}

// ─────────────────────────────────────────────────────
// Estado del botón principal
// ─────────────────────────────────────────────────────

describe('TimerControls — botón principal (ES)', () => {
  it('muestra "Iniciar" en estado inicial (prep, timeLeft=preparationTime)', () => {
    renderControls()
    expect(screen.getByRole('button', { name: /iniciar/i })).toBeTruthy()
  })

  it('muestra "Reanudar" cuando timeLeft < preparationTime (mid-workout)', () => {
    renderControls({ isPreparationPhase: true, timeLeft: 5, preparationTime: 10 })
    expect(screen.getByRole('button', { name: /reanudar/i })).toBeTruthy()
  })

  it('muestra "Pausar" cuando isRunning=true', () => {
    renderControls({ isRunning: true })
    expect(screen.getByRole('button', { name: /pausar/i })).toBeTruthy()
  })

  it('muestra "¡Completado!" cuando isFinished=true', () => {
    renderControls({ isFinished: true })
    expect(screen.getByText(/completado/i)).toBeTruthy()
  })

  it('botón deshabilitado cuando isFinished=true', () => {
    renderControls({ isFinished: true })
    const btn = screen.getByRole('button', { name: /completado/i })
    expect(btn.disabled).toBe(true)
  })

  it('muestra "Cargando..." cuando musicMode=true y playerStatus=loading', () => {
    renderControls({ musicMode: true, playerStatus: 'loading' })
    expect(screen.getByText(/cargando/i)).toBeTruthy()
  })

  it('botón deshabilitado cuando musicMode=true y playerStatus=loading', () => {
    renderControls({ musicMode: true, playerStatus: 'loading' })
    const btn = screen.getByRole('button', { name: /cargando/i })
    expect(btn.disabled).toBe(true)
  })
})

// ─────────────────────────────────────────────────────
// Botones skip/reset (solo visibles cuando hasStarted=true)
// ─────────────────────────────────────────────────────

describe('TimerControls — botones skip/reset', () => {
  it('no muestra skip/reset cuando hasStarted=false', () => {
    renderControls({ hasStarted: false })
    expect(screen.queryByTitle(/saltar/i)).toBeNull()
    expect(screen.queryByTitle(/reiniciar/i)).toBeNull()
  })

  it('muestra reset cuando hasStarted=true', () => {
    renderControls({ hasStarted: true })
    expect(screen.getByTitle(/reiniciar/i)).toBeTruthy()
  })

  it('muestra skip cuando hasStarted=true y showSkipButton=true', () => {
    renderControls({ hasStarted: true, showSkipButton: true })
    expect(screen.getByTitle(/saltar/i)).toBeTruthy()
  })

  it('skip deshabilitado cuando isFinished=true', () => {
    renderControls({ hasStarted: true, showSkipButton: true, isFinished: true })
    const skip = screen.getByTitle(/saltar/i)
    expect(skip.disabled).toBe(true)
  })
})

// ─────────────────────────────────────────────────────
// Callbacks
// ─────────────────────────────────────────────────────

describe('TimerControls — callbacks', () => {
  it('click en start llama handleStart', () => {
    const handleStart = vi.fn()
    renderControls({ handleStart })
    fireEvent.click(screen.getByRole('button', { name: /iniciar/i }))
    expect(handleStart).toHaveBeenCalledOnce()
  })

  it('click en pause llama handlePause', () => {
    const handlePause = vi.fn()
    renderControls({ isRunning: true, handlePause })
    fireEvent.click(screen.getByRole('button', { name: /pausar/i }))
    expect(handlePause).toHaveBeenCalledOnce()
  })

  it('click en reset llama handleReset', () => {
    const handleReset = vi.fn()
    renderControls({ hasStarted: true, handleReset })
    fireEvent.click(screen.getByTitle(/reiniciar/i))
    expect(handleReset).toHaveBeenCalledOnce()
  })
})

// ─────────────────────────────────────────────────────
// i18n — textos cambian con idioma
// ─────────────────────────────────────────────────────

describe('TimerControls — i18n EN', () => {
  it('muestra "Start" en inglés en estado inicial', () => {
    renderControls({}, 'en')
    expect(screen.getByRole('button', { name: /start/i })).toBeTruthy()
  })

  it('muestra "Resume" en inglés (mid-workout)', () => {
    renderControls({ isPreparationPhase: true, timeLeft: 5, preparationTime: 10 }, 'en')
    expect(screen.getByRole('button', { name: /resume/i })).toBeTruthy()
  })

  it('reset tooltip en inglés', () => {
    renderControls({ hasStarted: true }, 'en')
    expect(screen.getByTitle(/reset/i)).toBeTruthy()
  })
})

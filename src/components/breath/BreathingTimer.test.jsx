// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/preact'
import BreathingTimer from './BreathingTimer'

afterEach(cleanup)

// Mock breathingAudio — no audio real en tests
vi.mock('../../utils/audioUtils', () => ({
  breathingAudio: {
    initialize: vi.fn().mockResolvedValue(true),
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    resume: vi.fn(),
    setVolume: vi.fn(),
    shouldBePlaying: false,
  }
}))

// useDoubleClick puede necesitar timer — lo dejamos intacto

const BOX_PHASES = [
  { name: 'Inhale', duration: 4, instruction: 'Breathe In',  color: 'inhale', type: 'inhale' },
  { name: 'Hold',   duration: 4, instruction: 'Hold',        color: 'hold1',  type: 'hold'   },
  { name: 'Exhale', duration: 4, instruction: 'Breathe Out', color: 'exhale', type: 'exhale' },
  { name: 'Hold',   duration: 4, instruction: 'Hold',        color: 'hold2',  type: 'hold'   },
]

const SIMPLE_PHASES = [
  { name: 'Inhale', duration: 2, instruction: 'Breathe In',  color: 'inhale', type: 'inhale' },
  { name: 'Exhale', duration: 2, instruction: 'Breathe Out', color: 'exhale', type: 'exhale' },
]

function renderBreathing(phases = BOX_PHASES, props = {}) {
  return render(
    <BreathingTimer
      name="Test Breathing"
      phases={phases}
      patternName="test-pattern"
      className="test-breath"
      showBackButton={false}
      {...props}
    />
  )
}

// ─────────────────────────────────────────────────────
// Render inicial
// ─────────────────────────────────────────────────────

describe('BreathingTimer — render inicial', () => {
  it('muestra el nombre del timer', () => {
    renderBreathing()
    expect(screen.getByText('Test Breathing')).toBeTruthy()
  })

  it('muestra la primera fase', () => {
    renderBreathing()
    expect(screen.getByText('Inhale')).toBeTruthy()
  })

  it('muestra la instrucción de la primera fase', () => {
    renderBreathing()
    expect(screen.getByText('Breathe In')).toBeTruthy()
  })

  it('muestra el contador en la duración inicial', () => {
    renderBreathing()
    expect(screen.getByText('4')).toBeTruthy()
  })

  it('muestra botón Start en estado inicial', () => {
    renderBreathing()
    expect(screen.getByText('Start')).toBeTruthy()
  })

  it('muestra "Cycle 1" en inicio', () => {
    renderBreathing()
    expect(screen.getByText('Cycle 1')).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────
// Controles — Start / Pause / Reset
// ─────────────────────────────────────────────────────

describe('BreathingTimer — controles', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('click en Start muestra botón Pause', async () => {
    renderBreathing()
    fireEvent.click(screen.getByText('Start'))
    expect(screen.getByText('Pause')).toBeTruthy()
  })

  it('click en Pause vuelve a mostrar botón de start', async () => {
    renderBreathing()
    fireEvent.click(screen.getByText('Start'))
    fireEvent.click(screen.getByText('Pause'))
    // Pausar en fase 0, ciclo 0 → vuelve a "Start"
    expect(screen.getByText('Start')).toBeTruthy()
  })

  it('Reset vuelve a fase 0 y muestra Start', async () => {
    renderBreathing()
    fireEvent.click(screen.getByText('Start'))
    fireEvent.click(screen.getByText('Reset'))
    expect(screen.getByText('Start')).toBeTruthy()
    expect(screen.getByText('Inhale')).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────
// Skip Phase
// ─────────────────────────────────────────────────────

describe('BreathingTimer — Skip Phase', () => {
  it('skip avanza a la siguiente fase (phase-indicator cambia)', () => {
    renderBreathing(BOX_PHASES)
    fireEvent.click(screen.getByText('Skip Phase'))
    const indicator = document.querySelector('.phase-indicator')
    expect(indicator.textContent).toBe('Hold')
  })

  it('skip en la última fase vuelve a la primera (wrap)', () => {
    renderBreathing(SIMPLE_PHASES)
    fireEvent.click(screen.getByText('Skip Phase')) // Inhale → Exhale
    fireEvent.click(screen.getByText('Skip Phase')) // Exhale → Inhale (wrap)
    expect(screen.getByText('Inhale')).toBeTruthy()
  })

  it('skip al final del ciclo incrementa cycle count', () => {
    renderBreathing(SIMPLE_PHASES)
    fireEvent.click(screen.getByText('Skip Phase')) // fase 0→1
    fireEvent.click(screen.getByText('Skip Phase')) // fase 1→0 = ciclo completo
    expect(screen.getByText('Cycle 2')).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────
// Timer countdown — fases avanzan con el tiempo
// ─────────────────────────────────────────────────────

describe('BreathingTimer — countdown avanza fases', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('después de duration+1 segundos la fase avanza', async () => {
    renderBreathing(SIMPLE_PHASES) // duration=2
    fireEvent.click(screen.getByText('Start'))
    // Avanza 2s: completa la fase Inhale
    await act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByText('Exhale')).toBeTruthy()
  })

  it('después de 2 ciclos completos cycle count es 2', async () => {
    renderBreathing(SIMPLE_PHASES) // 2 fases × 2s
    fireEvent.click(screen.getByText('Start'))
    // 4s = 1 ciclo completo (2 fases × 2s)
    await act(() => { vi.advanceTimersByTime(4000) })
    // 8s = 2 ciclos completos
    await act(() => { vi.advanceTimersByTime(4000) })
    expect(screen.getByText('Cycle 3')).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────
// Guidance text — rotación por ciclo
// ─────────────────────────────────────────────────────

const GUIDED_PHASES = [
  { name: 'Inhale', duration: 2, instruction: 'Breathe In', color: 'inhale', type: 'inhale',
    guidances: ['Breathe slowly', 'Fill lungs fully', 'Deep breath'] },
  { name: 'Exhale', duration: 2, instruction: 'Breathe Out', color: 'exhale', type: 'exhale',
    guidances: ['Drop shoulders', 'Think of gratitude', 'Let it go'] },
]

describe('BreathingTimer — guidance text', () => {
  it('muestra guidance del ciclo 0 en la primera fase', () => {
    renderBreathing(GUIDED_PHASES)
    expect(screen.getByText('Breathe slowly')).toBeTruthy()
  })

  it('no renderiza .breathing-guidance si la fase no tiene guidances', () => {
    renderBreathing(SIMPLE_PHASES)
    expect(document.querySelector('.breathing-guidance')).toBeNull()
  })

  it('guidance cambia al avanzar al siguiente ciclo', () => {
    renderBreathing(GUIDED_PHASES)
    expect(screen.getByText('Breathe slowly')).toBeTruthy()
    // 2 skips = 1 ciclo completo (Inhale→Exhale→Inhale) → cycleCount=1
    fireEvent.click(screen.getByText('Skip Phase'))
    fireEvent.click(screen.getByText('Skip Phase'))
    expect(screen.getByText('Fill lungs fully')).toBeTruthy()
  })

  it('guidance cicla modulo guidances.length (ciclo 3 = índice 0)', () => {
    renderBreathing(GUIDED_PHASES) // 3 guidances
    for (let i = 0; i < 6; i++) {       // 6 skips = 3 ciclos completos
      fireEvent.click(screen.getByText('Skip Phase'))
    }
    expect(screen.getByText('Breathe slowly')).toBeTruthy()
  })

  it('guidance de exhale se muestra al hacer skip a exhale', () => {
    renderBreathing(GUIDED_PHASES)
    fireEvent.click(screen.getByText('Skip Phase')) // Inhale → Exhale
    expect(screen.getByText('Drop shoulders')).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────
// JS-driven animation — circleRef recibe transform
// ─────────────────────────────────────────────────────

describe('BreathingTimer — animación JS en circleRef', () => {
  it('elemento .breathing-circle existe en el DOM', () => {
    renderBreathing()
    const circle = document.querySelector('.breathing-circle')
    expect(circle).toBeTruthy()
  })

  it('en reposo (no running), circle tiene scale(0.65)', () => {
    renderBreathing()
    const circle = document.querySelector('.breathing-circle')
    expect(circle.style.transform).toContain('scale(0.65)')
  })
})

// ─────────────────────────────────────────────────────
// Estructura de fases — BoxBreathing 4 fases
// ─────────────────────────────────────────────────────

describe('BreathingTimer — fases BoxBreathing', () => {
  it('muestra 4 patrones distintos usando Skip', () => {
    renderBreathing(BOX_PHASES)
    const phaseNames = []
    for (let i = 0; i < 4; i++) {
      const indicator = document.querySelector('.phase-indicator')
      phaseNames.push(indicator.textContent)
      fireEvent.click(screen.getByText('Skip Phase'))
    }
    expect(phaseNames[0]).toBe('Inhale')
    expect(phaseNames[1]).toBe('Hold')
    expect(phaseNames[2]).toBe('Exhale')
    expect(phaseNames[3]).toBe('Hold')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { t, DEFAULT_LANG, VALID_LANGS } from './index'
import { saveLanguage, loadLanguage } from './languageStorage'

// localStorage mock
const makeStorage = () => {
  const store = new Map()
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
}

global.localStorage = makeStorage()
beforeEach(() => global.localStorage.clear())

// ─────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────

describe('constants', () => {
  it('DEFAULT_LANG is es', () => {
    expect(DEFAULT_LANG).toBe('es')
  })

  it('VALID_LANGS includes es and en', () => {
    expect(VALID_LANGS).toContain('es')
    expect(VALID_LANGS).toContain('en')
  })
})

// ─────────────────────────────────────────────────────
// languageStorage
// ─────────────────────────────────────────────────────

describe('loadLanguage', () => {
  it('returns es when localStorage is empty', () => {
    expect(loadLanguage()).toBe('es')
  })

  it('returns saved lang when en was stored', () => {
    saveLanguage('en')
    expect(loadLanguage()).toBe('en')
  })

  it('returns es when stored value is invalid', () => {
    global.localStorage.setItem('timer-app-lang', 'fr')
    expect(loadLanguage()).toBe('es')
  })

  it('returns es when stored value is garbage', () => {
    global.localStorage.setItem('timer-app-lang', '???')
    expect(loadLanguage()).toBe('es')
  })
})

describe('saveLanguage', () => {
  it('persists en to localStorage', () => {
    saveLanguage('en')
    expect(global.localStorage.getItem('timer-app-lang')).toBe('en')
  })

  it('persists es to localStorage', () => {
    saveLanguage('es')
    expect(global.localStorage.getItem('timer-app-lang')).toBe('es')
  })

  it('does not save invalid lang', () => {
    saveLanguage('fr')
    expect(global.localStorage.getItem('timer-app-lang')).toBeNull()
  })

  it('does not save null', () => {
    saveLanguage(null)
    expect(global.localStorage.getItem('timer-app-lang')).toBeNull()
  })

  it('does not save empty string', () => {
    saveLanguage('')
    expect(global.localStorage.getItem('timer-app-lang')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────
// t() — función de traducción
// ─────────────────────────────────────────────────────

describe('t() Spanish', () => {
  it('retorna string para clave válida anidada', () => {
    const val = t('es', 'setup.startButton')
    expect(typeof val).toBe('string')
    expect(val.length).toBeGreaterThan(0)
  })

  it('retorna string diferente para mismo key en en vs es', () => {
    const es = t('es', 'setup.startButton')
    const en = t('en', 'setup.startButton')
    expect(es).not.toBe(en)
  })

  it('setup.startButton en ES no está vacío', () => {
    expect(t('es', 'setup.startButton')).toBeTruthy()
  })

  it('setup.startButton en EN no está vacío', () => {
    expect(t('en', 'setup.startButton')).toBeTruthy()
  })
})

describe('t() fallbacks', () => {
  it('retorna la key como fallback si no existe', () => {
    expect(t('es', 'clave.inexistente')).toBe('clave.inexistente')
  })

  it('no explota con key de un solo nivel inexistente', () => {
    expect(() => t('es', 'inexistente')).not.toThrow()
  })

  it('no explota con key vacía', () => {
    expect(() => t('es', '')).not.toThrow()
  })

  it('no explota con lang inválido, usa es como fallback', () => {
    expect(() => t('fr', 'setup.startButton')).not.toThrow()
    const val = t('fr', 'setup.startButton')
    expect(val).toBe(t('es', 'setup.startButton'))
  })

  it('profundidad 3+ niveles funciona si existe', () => {
    const val = t('es', 'active.controls.reset')
    expect(typeof val).toBe('string')
    expect(val.length).toBeGreaterThan(0)
  })
})

describe('t() claves clave de UI', () => {
  const uiKeys = [
    'setup.startButton',
    'setup.preparation',
    'setup.intervalSettings',
    'active.activeSession',
    'active.controls.reset',
    'active.controls.start',
    'active.controls.pause',
    'active.controls.skip',
  ]

  for (const key of uiKeys) {
    it(`'${key}' existe en ES y EN`, () => {
      expect(t('es', key)).not.toBe(key)
      expect(t('en', key)).not.toBe(key)
    })
  }
})

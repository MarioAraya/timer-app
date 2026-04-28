# SPEC: i18n Language Toggle (ES/EN)

## Objetivo

Agregar soporte bilingüe español/inglés a la PWA de timers. Español es el idioma por defecto. El usuario puede cambiar el idioma desde la pantalla principal (TimersHome). La preferencia persiste en localStorage.

## Alcance

**Incluye:**
- Infraestructura i18n: archivos de traducciones `src/i18n/es.js` y `src/i18n/en.js`
- Hook `useLanguage` con persistencia en localStorage
- Contexto Preact `LanguageContext` para acceso global
- Toggle EN/ES en `TimersHome`
- Traducir todas las strings visibles al usuario en: `TimersHome`, `WorkoutSetupView`, `WorkoutActiveView`, `HiitSetupView` (tema), `TabataSetupView` (tema), `HiitTimerNew`, `TabataTimerNew`, `AuthModal`, `UserMenu`
- Strings en configs de fases (workSubtitle, restSubtitle, finalRest) — las configs se generan desde ticks por lo que las strings en `hiitConfig.js` / `tabataConfig.js` también se traducen

**No incluye:**
- Librerías externas (react-i18next, i18next, etc.) — solución propia simple
- Pluralización compleja
- Traducción de breathing timers y Pomodoro (fuera de scope por ahora)

## Arquitectura

```
src/
  i18n/
    es.js          ← traducciones español (default)
    en.js          ← traducciones inglés
    index.js       ← export { es, en }, helper t(lang, key)
  context/
    LanguageContext.jsx  ← Preact context + provider
  hooks/
    useLanguage.js ← lee/escribe localStorage 'timer-app-lang'
```

### API del hook

```js
const { lang, setLang, t } = useLanguage()
// lang: 'es' | 'en'
// t('setup.startButton') → string traducida según lang actual
```

### Estructura de claves de traducción

```js
{
  // TimersHome
  home: {
    categories: { fitness: '', wellness: '', productivity: '' },
    timers: {
      hiit: { name: '', title: '', description: '' },
      tabata: { name: '', title: '', description: '' },
      pomodoro: { name: '', title: '', description: '' },
      boxBreathing: { name: '', title: '', description: '' },
      relaxingBreath: { name: '', title: '', description: '' },
      calmingBreath: { name: '', title: '', description: '' },
    }
  },
  // Setup view
  setup: {
    title: '',              // 'Workout Setup' / 'Configuración'
    totalTime: '',
    intervalSettings: '',
    preparation: '',
    introLabel: '',
    workInterval: '',
    restInterval: '',
    recovery: '',
    startButton: '',        // 'START WORKOUT' / 'INICIAR'
    sets: '',
  },
  // Active view
  active: {
    activeSession: '',
    totalElapsed: '',
    currentMode: '',
    seconds: '',
    setProgress: '',
    finished: '',
    completedRounds: '',
    controls: {
      reset: '',
      start: '',
      pause: '',
      skip: '',
      musicOn: '',
      beepsOn: '',
    }
  },
  // Fases HIIT
  hiit: {
    workLabel: '',          // 'HIGH INTENSITY'
    phases: {
      work: ['', ...],      // subtítulos por ronda
      rest: ['', ...],
      finalRest: '',
      preparation: '',
    },
    quote: '',
    finishedTitle: '',
  },
  // Fases Tabata
  tabata: {
    workLabel: '',
    phases: { ... },
    finishedTitle: '',
  },
  // Auth
  auth: {
    signIn: '',
    saveProgress: '',
    checkEmail: '',
    emailSent: '',
    enterEmail: '',
    sendLink: '',
    orUse: '',
    googleSignIn: '',
  }
}
```

## Toggle UI

Botón simple en `TimersHome` header: `ES | EN` o un icono de globo + texto. Sin menú desplegable. Click alterna directamente.

## Testing

Tests unitarios **antes** de implementar (TDD):
- Archivo: `src/i18n/useLanguage.test.js`
- Casos:
  1. Default lang es 'es' cuando no hay nada en localStorage
  2. `setLang('en')` persiste en localStorage
  3. Al iniciar con localStorage='en' carga inglés
  4. `t('setup.startButton')` retorna string correcta en ES y EN
  5. `t('key.inexistente')` retorna la key como fallback (no explota)
  6. `setLang` con valor inválido no cambia el idioma

## Criterios de aceptación

- [ ] Todos los tests pasan con `npm run test`
- [ ] Toggle visible en TimersHome, persiste entre sesiones
- [ ] Toda la UI de HIIT y Tabata (setup + active) aparece en español por defecto
- [ ] Cambiar a EN muestra todo en inglés sin recargar página
- [ ] No rompe audio sync (strings de fases no afectan ticks)
- [ ] Build sin errores: `npm run build`

## Implementación — orden de tareas

1. Escribir tests unitarios (`src/i18n/useLanguage.test.js`) — deben fallar
2. Crear `src/i18n/es.js`, `src/i18n/en.js`, `src/i18n/index.js`
3. Crear `src/hooks/useLanguage.js` — pasar tests
4. Crear `src/context/LanguageContext.jsx` — provider
5. Wrappear `App.jsx` con provider
6. Agregar toggle en `TimersHome`
7. Traducir `WorkoutSetupView` + temas de HIIT/Tabata setup
8. Traducir `WorkoutActiveView`
9. Traducir `HiitTimerNew` + `TabataTimerNew` (subtítulos de fases)
10. Traducir `AuthModal` + `UserMenu`

# Tests

## Cómo correr los tests

### Unit + Integración + Componentes (Vitest)

```bash
# Todos los tests una vez
npm test

# Modo watch
npm run test:watch

# Archivo específico
npx vitest run src/utils/ticksEngine.test.js
npx vitest run src/utils/localStorage.test.js
npx vitest run src/utils/integration.test.js
npx vitest run src/i18n/useLanguage.test.js
npx vitest run src/utils/timerHelpers.test.js
npx vitest run src/utils/audioUtils.test.js
npx vitest run src/components/workout/TimerControls.test.jsx
npx vitest run src/components/TimersHome.test.jsx
npx vitest run src/components/breath/BreathingTimer.test.jsx
npx vitest run src/components/pomodoro/PomodoroSetupView.test.jsx
```

### E2E (Playwright)

```bash
# Instalar Playwright (primera vez)
npm install
npx playwright install chromium

# Correr tests E2E (arranca el dev server automáticamente)
npm run test:e2e

# Modo UI interactivo (ver el browser en tiempo real)
npm run test:e2e:ui
```

**Total unit/integración/componentes: 274 tests passing**
**Total E2E: 28 tests**

> 3 tests en `useLanguage.test.js` fallan de forma pre-existente: `loadLanguage` usa `navigator.languages` que no existe en el env node. No afectan funcionalidad.

---

## Infraestructura

- **Unit/integración:** Vitest (node env)
- **Componentes:** Vitest + jsdom + `@testing-library/preact` — usar `// @vitest-environment jsdom` en el archivo de test
- **Helper compartido:** `src/test/renderWithLang.jsx` — wrappea componentes con `LanguageContext.Provider`
- **E2E:** Playwright (Chromium)

---

## Archivos de test

### `src/utils/ticksEngine.test.js` — Unit (47 tests)

Motor central de timing: convierte arrays de timestamps MP3 en configuración de rounds. **Test más crítico** — si falla, audio y timer están desincronizados.

| Suite | Descripción |
|---|---|
| `buildConfigFromTicks` | HIIT 12 rounds, Tabata 8; duraciones prep/work/rest; subtítulos; error en ticks inválidos |
| `Phase transitions` | work > 0 por round; Tabata work=20s rest=10s exactos; secuencia completa correcta |
| `getStateFromElapsed` | Estado correcto en t=0, inicio work, mid-round, rest, seek atrás, pasado el final |
| `getExpectedAudioPosition` | Posición en init y work-1; round-trip `elapsed → state → audioPosition` con tolerancia |
| `validateConfigAgainstTicks` | Config HIIT coincide con marcas de calibración dentro de ±0.1s para rounds 1–6 |
| `getTotalDuration` | HIIT ~732.5s; Tabata exactamente 241s |
| `Edge cases` | Boundaries exactos entre fases; elapsed negativo; seek pasado el final |
| `Skip phase simulation` | Saltar prep, work, rest; recorrido completo 8 rounds Tabata |

---

### `src/utils/localStorage.test.js` — Unit (37 tests)

Persistencia de estado entre sesiones. Protege contra renombres de keys y roturas en la expiración de 1 hora.

| Suite | Descripción |
|---|---|
| `saveToStorage / loadFromStorage` | Roundtrip objetos/números; null para key inexistente; sobreescritura |
| `removeFromStorage` | Elimina key existente; no lanza error en key inexistente |
| `favoriteTimer / activeTimer` | Save/load/clear |
| `HIIT state persistence` | Todos los campos; timestamp; >1h → null; <1h aceptado; expiración borra key |
| `Tabata / Pomodoro state` | Guarda/carga; expiración; clear |
| `clearAllTimerData` | Limpia los 4 timers a la vez; no lanza error con storage vacío |
| `storage key names` | Keys exactas — previene renombres accidentales |

---

### `src/utils/integration.test.js` — Integración (30 tests)

Cruza `ticksEngine`, `localStorage` y los configs. Detecta regresiones cross-módulo.

| Suite | Descripción |
|---|---|
| `HIIT: ciclo pausa/resume` | Estado en elapsed T, restaura, verifica round/fase/audioPosition consistentes |
| `HIIT y Tabata: no se pisan` | Keys distintas; `clearAllTimerData` limpia ambos |
| `HIIT: invariante audio` | `getExpectedAudioPosition(getStateFromElapsed(t)) ≈ t` ±0.5s para todo T |
| `Tabata: invariante audio` | Misma verificación, tolerancia 0.1s |
| `HIIT_CONFIG vs CALIBRATION_MARKS` | Valores hardcodeados coinciden con marcas del MP3 (rounds 1–6) |
| `TABATA_CONFIG vs TABATA_TICKS` | Config manual coincide con ticks |
| `Forma de los configs` | 4 configs tienen `preparation.duration`, `rounds[].work`, `rounds[].rest` válidos |

---

### `src/i18n/useLanguage.test.js` — Unit (41 tests)

Sistema i18n (español/inglés). Protege contra keys faltantes y lógica de persistencia.

| Suite | Descripción |
|---|---|
| `constants` | `DEFAULT_LANG` es `en`; `VALID_LANGS` incluye `es` y `en` |
| `loadLanguage` | Carga idioma guardado; rechaza inválidos |
| `saveLanguage` | Persiste `es`/`en`; ignora inválidos/null/vacío |
| `t() Spanish` | Retorna string para keys anidadas; ES y EN difieren |
| `t() fallbacks` | Retorna la key si no existe; no lanza error con key vacía o lang inválido |
| `t() claves UI` | 8 keys críticas existen en ES y EN |
| `active.controls nuevas` | `resume`, `loading` existen en ES y EN |
| `pomodoro.audio.*` | 7 keys de audio Pomodoro existen en ES y EN |

---

### `src/utils/timerHelpers.test.js` — Unit (29 tests)

Cálculos de progreso y elapsed. Cubre todos los estados del timer.

| Suite | Descripción |
|---|---|
| `formatTime` | 0:00, 1:05, 60:00; trunca fracciones |
| `formatTimeSeconds` | padding de 2 dígitos; trunca fracciones |
| `calculateProgress` | 0%, 50%, 100% |
| `getTotalWorkoutSeconds` | prep + rounds × (work + rest) |
| `calculateElapsedTime` | inicio prep, mid prep, inicio work, mid work, inicio rest, round 2, nunca negativo |
| `calculateTotalProgress` | isFinished → 100; inicio → 0; siempre en [0, 100] |
| `calculateRoundProgress` | isFinished → 100; fases prep/work/rest; ring resetea al inicio de cada fase; round inexistente → 0 |

---

### `src/utils/audioUtils.test.js` — Unit/jsdom (17 tests)

`WorkoutAudioPlayer` y `LofiPlaylistPlayer`. Usa `vi.stubGlobal('Audio', ...)` para mockear HTMLAudioElement.

| Suite | Descripción |
|---|---|
| `WorkoutAudioPlayer — shouldBePlaying` | false inicial; true post-play; false post-stop/pause; true post-resume |
| `WorkoutAudioPlayer — watchdog` | null antes de play; stopWatchdog() limpia watchdog y shouldBePlaying |
| `WorkoutAudioPlayer — shouldIgnorePause` | true dentro de los primeros 2s post-play |
| `LofiPlaylistPlayer — nextTrack` | currentIndex=0 inicial; incrementa; wrap al final; inTrackTransition=true; playerReady=false durante transición; shouldIgnorePause=true |
| `LofiPlaylistPlayer — repeatTrack` | no cambia index; resetea currentTime=0 |
| `LofiPlaylistPlayer — ended event` | ended → _nextTrack → index avanza |

---

### `src/components/workout/TimerControls.test.jsx` — Component/jsdom (17 tests)

Botón principal del timer con todos sus estados. Verifica i18n en ES y EN.

| Suite | Descripción |
|---|---|
| `botón principal (ES)` | Iniciar (prep inicial); Reanudar (mid-workout); Pausar (running); ¡Completado! (finished, disabled); Cargando... (musicMode+loading, disabled) |
| `botones skip/reset` | Ocultos cuando hasStarted=false; visibles cuando hasStarted=true; skip disabled si isFinished |
| `callbacks` | handleStart, handlePause, handleReset llamados al click |
| `i18n EN` | Start, Resume, Reset en inglés |

---

### `src/components/TimersHome.test.jsx` — Component/jsdom (17 tests)

Grid de cards con i18n. Verifica que el toggle de idioma funcione.

| Suite | Descripción |
|---|---|
| `cards en español` | HIIT, Tabata, Pomodoro, Respiración Cuadrada, Wim Hof visibles; 7 cards total; categorías en español |
| `cards en inglés` | HIIT Workout, Tabata Protocol, Pomodoro Timer en EN; Wellness visible; Bienestar ausente |
| `toggle de idioma` | Botón muestra ES/EN según lang; click llama setLang con idioma opuesto |
| `selección de timer` | click en card llama onTimerSelect con `component: 'HiitTimer'` |

---

### `src/components/breath/BreathingTimer.test.jsx` — Component/jsdom (17 tests)

Ciclo de fases, controles, countdown con fake timers y animación JS.

| Suite | Descripción |
|---|---|
| `render inicial` | Nombre, primera fase, instrucción, timeLeft, botón Start, Cycle 1 |
| `controles` | Start → Pause visible; Pause → Start visible; Reset → vuelve a fase 0 |
| `Skip Phase` | Avanza al siguiente; wrap al final del ciclo; incrementa cycle count al completar ciclo |
| `countdown` | Después de duration+1s la fase avanza; 2 ciclos → Cycle 3 |
| `animación JS` | `.breathing-circle` existe; tiene `scale(0.65)` en reposo |
| `fases BoxBreathing` | Skip × 4 produce Inhale → Hold → Exhale → Hold en orden |

---

### `src/components/pomodoro/PomodoroSetupView.test.jsx` — Component/jsdom (25 tests)

Presets, sliders custom, callback onStart, i18n.

| Suite | Descripción |
|---|---|
| `presets en ES` | 5 presets visibles; popular seleccionado por defecto; click en Medio → selected; Personalizado → sliders visibles; popular → sin sliders |
| `presets en EN` | Baby Steps, Medium, Extended, Custom visibles |
| `onStart callback` | popular → workDuration=20min; custom → duraciones de los sliders default |
| `i18n title y botón` | Título "Pomodoro"; "INICIAR" en ES; "START WORKOUT" en EN |
| `Pomodoro audio i18n keys` | 7 claves `pomodoro.audio.*` existen en ES y EN |

---

### `e2e/timer.spec.js` — E2E Playwright (28 tests)

Flujos reales en Chromium. Usa `data-testid` en elementos interactivos.

| Suite | Descripción |
|---|---|
| `HIIT Timer` | Card en home; setup; back; vista activa; iniciar; pausar; resetear; flujo completo |
| `Tabata Timer` | Mismos casos que HIIT |
| `Reproducción de MP3` | HIIT/Tabata/Pomodoro MP3 reproducen; Pomodoro música no se pausa con el tick |
| `Navegación` | Volver al home preserva cards; HIIT → Tabata en misma sesión |

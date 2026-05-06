# Tests

## Cómo correr los tests

### Unit + Integración (Vitest)

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

**Total unit/integración: 107 tests** — 39 (ticksEngine) + 27 (localStorage) + 23 (integración) + 18 (i18n)
**Total E2E: 18 tests** — 8 HIIT + 8 Tabata + 2 navegación

---

## Archivos de test

### `src/utils/ticksEngine.test.js` — Unit (39 tests)

Cubre la lógica central de timing: el motor que convierte arrays de timestamps MP3 en configuración de rounds. **Es el test más crítico del proyecto** — si algo aquí falla, el audio y el timer están desincronizados.

| Suite | Descripción |
|---|---|
| `buildConfigFromTicks` | HIIT genera 12 rounds, Tabata 8; duraciones de prep/work/rest correctas; subtítulos preservados; lanza error en ticks inválidos |
| `Phase transitions` | Cada round tiene work > 0; Tabata tiene work=20s y rest=10s exactos; recorrido completo produce la secuencia correcta (25 fases HIIT, 16 Tabata); ningún round es saltado |
| `getStateFromElapsed` | Estado correcto en t=0 (prep), inicio de work, mid-round, rest, seek hacia atrás, pasado el final |
| `getExpectedAudioPosition` | Posición en inicio de prep y work-1; round-trip `elapsed → state → audioPosition` consistente en múltiples puntos |
| `validateConfigAgainstTicks` | Config HIIT coincide con marcas de calibración dentro de ±0.1s para rounds 1–6 |
| `getTotalDuration` | HIIT ~732.5s; Tabata exactamente 241s |
| `Edge cases` | Boundaries exactos entre fases; elapsed negativo; seek pasado el final |
| `Skip phase simulation` | Saltar prep → work-1; work → rest; rest → siguiente round; recorrido completo cubre los 8 rounds de Tabata |

---

### `src/utils/localStorage.test.js` — Unit (27 tests)

Cubre la persistencia de estado entre sesiones. Protege contra renombres de keys, cambios en la lógica de expiración de 1 hora, y roturas en `clearAllTimerData`.

| Suite | Descripción |
|---|---|
| `saveToStorage / loadFromStorage` | Roundtrip de objetos y números; null para key inexistente; sobreescritura |
| `removeFromStorage` | Elimina key existente; no lanza error en key inexistente |
| `favoriteTimer` | Save/load del timer favorito |
| `activeTimer` | Save/load/clear del timer activo |
| `HIIT state persistence` | Guarda todos los campos; timestamp presente; >1h retorna null; exactamente 1h rechazado; <1h aceptado; expiración borra el key |
| `Tabata state persistence` | Guarda/carga campos; expiración; clear |
| `Pomodoro state persistence` | Guarda/carga campos; expiración; clear |
| `clearAllTimerData` | Limpia los 4 timers a la vez; no lanza error con storage vacío |
| `storage key names` | Verifica keys exactas (`timerApp_hiitState`, etc.) — previene renombres accidentales |

---

### `src/utils/integration.test.js` — Integración (23 tests)

Cruza `ticksEngine`, `localStorage` y los configs hardcodeados. Detecta regresiones que los unit tests no ven porque prueban cada módulo por separado.

| Suite | Descripción |
|---|---|
| `HIIT: ciclo pausa/resume` | Guarda estado en elapsed T, lo restaura, verifica que round/fase/audioPosition sean consistentes con T |
| `HIIT y Tabata: estados no se pisan` | Usan keys distintas en storage; `clearAllTimerData` limpia ambos simultáneamente |
| `HIIT: invariante de audio` | Para todo T del workout, `getExpectedAudioPosition(getStateFromElapsed(t)) ≈ t` con tolerancia 0.5s |
| `Tabata: invariante de audio` | Misma verificación para Tabata, tolerancia 0.1s (valores enteros exactos) |
| `HIIT_CONFIG vs CALIBRATION_MARKS` | Los valores hardcodeados en `hiitConfig.js` coinciden con las marcas de calibración del MP3 (rounds 1–6) |
| `TABATA_CONFIG vs TABATA_TICKS` | El config manual de Tabata coincide exactamente con lo que producen los ticks |
| `Forma de los configs` | Los 4 configs (2 hardcoded + 2 derivados de ticks) tienen `preparation.duration`, `rounds[].work`, `rounds[].rest` válidos |

---

### `src/i18n/useLanguage.test.js` — Unit (18 tests)

Cubre el sistema de i18n (español/inglés). Protege contra keys de traducción faltantes y lógica de persistencia del idioma.

| Suite | Descripción |
|---|---|
| `constants` | `DEFAULT_LANG` es `es`; `VALID_LANGS` incluye `es` y `en` |
| `loadLanguage` | Retorna `es` por defecto; carga idioma guardado; rechaza valores inválidos y garbage |
| `saveLanguage` | Persiste `es`/`en`; ignora idiomas inválidos, null y string vacío |
| `t() Spanish` | Retorna string para keys anidadas; ES y EN difieren para el mismo key |
| `t() fallbacks` | Retorna la key si no existe; no lanza error con key vacía o lang inválido |
| `t() claves UI` | Las 8 keys críticas de UI (`setup.startButton`, `active.controls.*`) existen en ES y EN |

---

### `e2e/timer.spec.js` — E2E Playwright (18 tests)

Verifica flujos reales en el browser: navegación, inicio, pausa, reset y vuelta al home. Usa `data-testid` en los elementos interactivos clave.

| Suite | Descripción |
|---|---|
| `HIIT Timer` | Card visible en home; click abre setup; back en setup vuelve al home; start abre vista activa; iniciar muestra pausa; pausar muestra inicio; reset deja el timer detenido; flujo completo home→setup→activo→pausar→resetear→setup→home |
| `Tabata Timer` | Mismos 8 casos que HIIT |
| `Navegación entre timers` | Volver al home preserva ambas cards; puede entrar a HIIT y luego a Tabata en la misma sesión |

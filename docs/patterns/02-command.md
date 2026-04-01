# Command — Patrón Comando

## Qué es

El patrón Command **encapsula una acción como un objeto**. En vez de ejecutar código directamente ("pausa el timer"), creas un objeto que representa esa intención y lo pasas al sistema para que lo ejecute.

```
┌────────────┐     crea     ┌─────────────┐    ejecuta    ┌──────────┐
│   Botón    │────────────→│  PauseCmd   │─────────────→│  Timer   │
│   (UI)     │             │  { type,    │              │  (lógica)│
│            │             │    payload } │              │          │
└────────────┘             └─────────────┘              └──────────┘
                                 │
                                 ├──→ Log: "14:23 PAUSE round=3"
                                 ├──→ History: [START, TICK, TICK, PAUSE]
                                 └──→ Undo: revertir la última acción
```

## El problema que resuelve

Hoy cada botón ejecuta lógica directamente:

```js
// ❌ El botón conoce los detalles de implementación
<button onClick={() => {
  setIsRunning(false)
  audioPlayer.pause()
  saveState()
  // ¿Y si quiero loggear esta acción? Toca agregar aquí
  // ¿Y si quiero deshacer? No hay registro de qué pasó
}}>
  Pausar
</button>
```

Problemas:
- **Sin historial:** no sabes qué acciones hizo el usuario durante la sesión.
- **Sin undo:** si haces skip por error, no puedes volver.
- **Lógica duplicada:** el mismo "pausar" se ejecuta desde botón, atajo de teclado, y blur del tab.
- **Difícil de loggear:** para enviar progreso al backend necesitas saber qué pasó.

## Cuándo usarlo

- Cuando la **misma acción se dispara desde múltiples lugares** (botón, atajo, evento del sistema).
- Cuando necesitas **historial** de lo que hizo el usuario.
- Cuando quieres **undo/redo**.
- Cuando necesitas **loggear o auditar** acciones (enviar al backend para analytics).
- Cuando necesitas **serializar acciones** (guardar en localStorage para restaurar sesión).

**Señales de que lo necesitas:**
- Copias/pegas el mismo bloque de lógica en onClick de distintos botones.
- Quieres saber "¿cuántas veces hizo skip?" y no tienes forma de saberlo.
- El usuario se queja de que "le dio skip sin querer" y no puedes revertir.

## Cómo se implementa

### Definir los comandos

```js
// src/utils/commands.js

// Cada comando es un objeto plano con tipo, timestamp, y datos opcionales
export function createCommand(type, payload = {}) {
  return {
    type,
    payload,
    timestamp: Date.now(),
  }
}

// Tipos de comando del workout
export const CMD = {
  START:       'START',
  PAUSE:       'PAUSE',
  RESUME:      'RESUME',
  SKIP:        'SKIP',
  RESET:       'RESET',
  SEEK:        'SEEK',
  VOLUME:      'VOLUME',
  TOGGLE_MODE: 'TOGGLE_MODE',  // beeps ↔ música
}
```

### Ejecutor de comandos (dispatcher)

```js
// src/hooks/useCommandDispatcher.js
import { useRef, useCallback } from 'preact/hooks'
import { createCommand } from '../utils/commands'

export function useCommandDispatcher(handlers) {
  // Historial de todos los comandos ejecutados en la sesión
  const history = useRef([])

  const dispatch = useCallback((type, payload) => {
    const cmd = createCommand(type, payload)

    // 1. Guardar en historial
    history.current.push(cmd)

    // 2. Ejecutar el handler correspondiente
    const handler = handlers[type]
    if (handler) {
      handler(cmd.payload)
    } else {
      console.warn(`Comando no reconocido: ${type}`)
    }

    // 3. (Opcional) Loggear para debug
    // console.log(`[CMD] ${type}`, payload)
  }, [handlers])

  const getHistory = useCallback(() => history.current, [])

  const getSessionSummary = useCallback(() => {
    const h = history.current
    return {
      totalCommands:  h.length,
      skips:          h.filter(c => c.type === 'SKIP').length,
      pauses:         h.filter(c => c.type === 'PAUSE').length,
      startedAt:      h[0]?.timestamp,
      finishedAt:     h[h.length - 1]?.timestamp,
      durationMs:     h.length > 1
        ? h[h.length - 1].timestamp - h[0].timestamp
        : 0,
    }
  }, [])

  return { dispatch, getHistory, getSessionSummary }
}
```

### Uso en el componente

```js
// Antes
<button onClick={() => {
  setIsRunning(false)
  audioPlayer.pause()
  saveState()
}}>
  Pausar
</button>

// Después
const { dispatch, getSessionSummary } = useCommandDispatcher({
  [CMD.START]:  () => { setIsRunning(true); audioPlayer.play() },
  [CMD.PAUSE]:  () => { setIsRunning(false); audioPlayer.pause(); saveState() },
  [CMD.SKIP]:   () => { advancePhase() },
  [CMD.RESET]:  () => { resetAll() },
})

// El botón solo envía la intención
<button onClick={() => dispatch(CMD.PAUSE)}>Pausar</button>

// El atajo de teclado envía la misma intención
useEffect(() => {
  const onKey = (e) => {
    if (e.code === 'Space') dispatch(isRunning ? CMD.PAUSE : CMD.RESUME)
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}, [isRunning])

// Al terminar el workout, tienes el resumen para enviar al backend
const onFinish = () => {
  const summary = getSessionSummary()
  api.progress.save({
    ...workoutData,
    skips: summary.skips,
    pauses: summary.pauses,
    durationMs: summary.durationMs,
  })
}
```

### Implementar Undo (opcional)

```js
// Para skip undoable, guardas el estado previo en el comando
const handlers = {
  [CMD.SKIP]: (payload) => {
    // Guardar estado actual para posible undo
    const prevState = { phase, round, timeRemaining }
    undoStack.current.push({ type: CMD.SKIP, prevState })
    advancePhase()
  },
}

const undo = () => {
  const last = undoStack.current.pop()
  if (last) {
    setPhase(last.prevState.phase)
    setRound(last.prevState.round)
    setTimeRemaining(last.prevState.timeRemaining)
  }
}
```

## Refactoring necesario en esta app

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| **Nuevo:** `src/utils/commands.js` | CMD enum + createCommand factory |
| **Nuevo:** `src/hooks/useCommandDispatcher.js` | Dispatcher + historial + resumen |
| `src/hooks/useTimerControls.js` | Reemplazar llamadas directas por `dispatch(CMD.X)` |
| `src/components/workout/TimerControls.jsx` | Botones usan `dispatch` en vez de props individuales |
| `src/components/WorkoutTimer.jsx` | Inicializar dispatcher, conectar handlers |

### Líneas de código estimadas

- **Nuevo código:** ~60 líneas (commands.js + hook)
- **Código modificado:** ~40 líneas en controles
- **Beneficio:** historial de sesión gratis, undo, y analytics listos para backend

### Lo que NO cambia

- La lógica interna de cada acción (solo se mueve a un handler)
- La UI visual
- El sistema de audio (se convierte en un handler más)

## Combinación con State Machine

Command y State Machine son complementarios:

```js
// El dispatcher envía eventos a la máquina de estados
const { dispatch } = useCommandDispatcher({
  [CMD.START]:  () => send('START'),     // send() es de la state machine
  [CMD.PAUSE]:  () => send('PAUSE'),
  [CMD.SKIP]:   () => send('SKIP'),
})

// Command: registra QUÉ hizo el usuario y CUÁNDO
// State Machine: decide A DÓNDE va el sistema
```

## Para profundizar

- **Gang of Four** — el Command original (Cap. 5 "Behavioral Patterns")
- **Redux** es esencialmente este patrón: actions son commands, reducers son handlers
- En el backend Go, los endpoints `POST /progress` ya reciben "comandos" (sesiones completadas)
- **CQRS** (Command Query Responsibility Segregation) es la extensión a nivel de arquitectura

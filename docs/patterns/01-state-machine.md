# State Machine — Máquina de Estados

## Qué es

Una máquina de estados define **todos los estados posibles** de un sistema y **las transiciones válidas** entre ellos. Si tu sistema está en el estado A, solo puede ir a B o C — nunca a Z directamente. Esto elimina estados imposibles por diseño.

```
┌──────┐    start    ┌──────┐   time=0   ┌──────┐   time=0   ┌──────┐
│ IDLE │───────────→│ PREP │──────────→│ WORK │──────────→│ REST │
└──────┘            └──────┘           └──────┘           └──────┘
                                          ↑                   │
                                          │   round < total   │
                                          └───────────────────┘
                                                              │
                                                round = total │
                                                              ↓
                                                        ┌──────────┐
                                                        │ FINISHED │
                                                        └──────────┘
```

## El problema que resuelve

Sin máquina de estados, las transiciones viven en `if/else` dispersos:

```js
// ❌ Así está hoy — lógica de transición dispersa en useEffect
useEffect(() => {
  if (timeRemaining <= 0) {
    if (phase === 'prep') {
      setPhase('work')
      setTimeRemaining(workSeconds)
    } else if (phase === 'work') {
      if (round >= totalRounds) {
        setPhase('finished')
      } else {
        setPhase('rest')
        setTimeRemaining(restSeconds)
      }
    } else if (phase === 'rest') {
      setPhase('work')
      setRound(r => r + 1)
      setTimeRemaining(workSeconds)
    }
  }
}, [timeRemaining])
```

Problemas de este enfoque:
- ¿Qué pasa si `phase` es `'work'` y alguien llama `setPhase('prep')`? Nada lo impide.
- ¿Puedes ver todos los estados y transiciones de un vistazo? No.
- ¿Cómo agregas un estado nuevo (ej. `cooldown` entre rondas)? Hay que tocar múltiples `if/else`.

## Cuándo usarlo

- Cuando tu sistema tiene **fases o estados discretos** (idle, running, paused, finished).
- Cuando las transiciones entre estados siguen **reglas fijas**.
- Cuando bugs surgen de **estados inválidos** ("¿cómo llegó a `finished` sin pasar por `work`?").
- Cuando necesitas agregar **nuevos estados** sin romper los existentes.

**Señales de que lo necesitas:**
- Tienes variables booleanas como `isRunning`, `isPaused`, `isFinished` que se combinan.
- Tienes `if (isRunning && !isPaused && phase === 'work')` — eso es un estado implícito.
- Un bug donde la UI muestra "Paused" pero el timer sigue corriendo.

## Cómo se implementa

### Versión mínima (sin librería)

```js
// src/utils/workoutMachine.js

// 1. Definir estados y transiciones en un solo lugar
const TRANSITIONS = {
  idle: {
    START: 'prep',
  },
  prep: {
    TICK_ZERO: 'work',     // cuando el tiempo llega a 0
    PAUSE:     'paused',
    RESET:     'idle',
  },
  work: {
    TICK_ZERO:      'rest',          // si quedan rondas
    TICK_ZERO_LAST: 'finished',      // si es la última ronda
    PAUSE:          'paused',
    SKIP:           'rest',
    RESET:          'idle',
  },
  rest: {
    TICK_ZERO: 'work',
    PAUSE:     'paused',
    SKIP:      'work',
    RESET:     'idle',
  },
  paused: {
    RESUME: 'previousPhase',  // vuelve al estado donde se pausó
    RESET:  'idle',
  },
  finished: {
    RESET: 'idle',
  },
}

// 2. Función de transición — el corazón de la máquina
export function transition(currentState, event) {
  const nextState = TRANSITIONS[currentState]?.[event]
  if (!nextState) {
    console.warn(`Transición inválida: ${currentState} + ${event}`)
    return currentState  // Quédate donde estás
  }
  return nextState
}

// 3. Configuración de cada estado
export const STATE_CONFIG = {
  idle:     { label: '',            color: null,       timerActive: false },
  prep:     { label: 'Prepárate',   color: '#ffc107',  timerActive: true  },
  work:     { label: '¡Trabaja!',   color: '#ff6b6b',  timerActive: true  },
  rest:     { label: 'Descansa',    color: '#74b9ff',  timerActive: true  },
  paused:   { label: 'Pausado',     color: '#6c757d',  timerActive: false },
  finished: { label: 'Terminado',   color: '#00b894',  timerActive: false },
}
```

### Uso en el componente

```js
// Antes: múltiples useState para representar estado
const [phase, setPhase] = useState('idle')
const [isRunning, setIsRunning] = useState(false)
const [isPaused, setIsPaused] = useState(false)

// Después: un solo estado derivado de la máquina
const [state, setState] = useState('idle')
const config = STATE_CONFIG[state]

const send = (event) => {
  setState(current => transition(current, event))
}

// En vez de: setPhase('work'); setIsRunning(true); setIsPaused(false);
// Ahora:    send('START')
```

### Manejar el "paused" que recuerda el estado anterior

```js
// Hook personalizado que envuelve la máquina
function useWorkoutMachine() {
  const [state, setState] = useState('idle')
  const [previousState, setPreviousState] = useState(null)

  const send = (event) => {
    setState(current => {
      if (event === 'PAUSE') {
        setPreviousState(current)
        return 'paused'
      }
      if (event === 'RESUME' && current === 'paused') {
        return previousState
      }
      return transition(current, event)
    })
  }

  return { state, send, config: STATE_CONFIG[state] }
}
```

## Refactoring necesario en esta app

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| **Nuevo:** `src/utils/workoutMachine.js` | Definir TRANSITIONS y STATE_CONFIG |
| `src/hooks/useWorkoutTimer.js` | Reemplazar `phase`/`isRunning` por `useWorkoutMachine()` |
| `src/components/WorkoutTimer.jsx` | Usar `state` y `send()` en vez de setters directos |
| `src/hooks/useTimerControls.js` | Llamar `send('PAUSE')`, `send('SKIP')` etc. |

### Líneas de código estimadas

- **Nuevo código:** ~80 líneas (workoutMachine.js)
- **Código eliminado:** ~120 líneas (if/else dispersos en hooks)
- **Neto:** reducción de ~40 líneas + eliminación de categoría completa de bugs

### Lo que NO cambia

- La UI, estilos y componentes visuales
- La lógica de audio (se suscribe a cambios de estado en vez de a cambios de phase)
- Las configuraciones en hiitConfig.js / tabataConfig.js

## Ejemplo real completo

```js
// Así se vería un tick del timer con state machine

function onTick() {
  setTimeRemaining(t => {
    if (t <= 1) {
      // Decidir qué evento enviar basado en contexto
      if (state === 'work' && round >= totalRounds) {
        send('TICK_ZERO_LAST')
      } else {
        send('TICK_ZERO')
      }
      // El nuevo timeRemaining se deriva del nuevo estado
      return getInitialTime(transition(state, 'TICK_ZERO'))
    }
    return t - 1
  })
}

function getInitialTime(newState) {
  switch (newState) {
    case 'prep': return config.prepSeconds
    case 'work': return config.workSeconds
    case 'rest': return config.restSeconds
    default:     return 0
  }
}
```

## Para profundizar

- **XState** es la librería estándar de state machines para JS (pero es overkill aquí; un objeto plano basta)
- El concepto viene de **Statecharts** de David Harel (1987) — la formalización matemática
- En backend Go, el mismo patrón aplica para modelar estados de sesiones de workout

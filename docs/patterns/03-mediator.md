# Mediator — Patrón Mediador

## Qué es

El Mediator es un objeto central que **coordina la comunicación entre componentes** que no deberían conocerse entre sí. En vez de que A hable con B y B hable con C directamente, todos hablan con el Mediator y él decide qué pasa.

```
       Sin Mediator                    Con Mediator
       ────────────                    ────────────

    Timer ←──→ Audio               Timer ──→ Mediator ←── Audio
      ↕          ↕                              ↕
    UI   ←──→ Storage                UI ──→ Mediator ←── Storage

  (todos se conocen entre sí)      (nadie se conoce, solo al mediador)
```

## El problema que resuelve

En esta app, la sincronización de audio con el timer es el componente más complejo. Hoy está así:

```js
// ❌ audioUtils.js conoce detalles del timer
// ❌ WorkoutTimer.jsx conoce detalles de audioUtils
// ❌ El hook useAudioSync.js es el "pegamento" pero está acoplado a ambos

// En WorkoutTimer.jsx:
useEffect(() => {
  if (phase === 'work') {
    audioPlayer.seekTo(getWorkOffset(round))
    audioPlayer.play()
  } else if (phase === 'rest') {
    audioPlayer.seekTo(getRestOffset(round))
    audioPlayer.play()
  } else if (phase === 'finished') {
    audioPlayer.stop()
  }

  // ¿Y si quiero agregar efectos de sonido para la UI? Toca meter más lógica aquí
  // ¿Y si quiero guardar el estado? Más lógica aquí
  // Este useEffect crece sin parar
}, [phase, round])
```

Problemas:
- **El timer sabe demasiado sobre audio** — qué función llamar, qué offset usar.
- **El audio sabe demasiado sobre el timer** — watchdog que chequea si el timer sigue activo.
- **Agregar un nuevo actor** (ej. haptic feedback, notificaciones, analytics) requiere modificar el timer.
- **Testear es difícil** — no puedes testear el timer sin mockear el audio completo.

## Cuándo usarlo

- Cuando **múltiples objetos interactúan** y la lógica de coordinación está dispersa.
- Cuando **agregar un nuevo participante** requiere modificar los existentes.
- Cuando la comunicación entre componentes crea una **red de dependencias** difícil de seguir.
- Cuando quieres **testear componentes aislados** sin arrastrar sus dependencias.

**Señales de que lo necesitas:**
- Un `useEffect` con 5+ dependencias que coordina múltiples sistemas.
- Cambiar algo en el audio rompe algo en el timer (o viceversa).
- No puedes agregar "haptic feedback al cambiar de fase" sin tocar el timer core.

## Cómo se implementa

### El Mediator como Event Bus

```js
// src/utils/workoutMediator.js

// Un mediador simple basado en eventos
export function createWorkoutMediator() {
  const listeners = new Map()

  return {
    // Registrar un listener para un evento
    on(event, callback) {
      if (!listeners.has(event)) {
        listeners.set(event, [])
      }
      listeners.get(event).push(callback)

      // Devolver función de cleanup
      return () => {
        const cbs = listeners.get(event)
        const idx = cbs.indexOf(callback)
        if (idx >= 0) cbs.splice(idx, 1)
      }
    },

    // Emitir un evento a todos los interesados
    emit(event, data) {
      const cbs = listeners.get(event) || []
      cbs.forEach(cb => cb(data))
    },

    // Limpiar todo
    destroy() {
      listeners.clear()
    },
  }
}

// Eventos del sistema de workout
export const EVENTS = {
  // Estado
  PHASE_CHANGED:  'phase:changed',    // { phase, round, timeRemaining }
  TIMER_TICK:     'timer:tick',        // { timeRemaining }
  WORKOUT_START:  'workout:start',     // { config }
  WORKOUT_FINISH: 'workout:finish',    // { stats }
  WORKOUT_RESET:  'workout:reset',     // {}

  // Controles
  PAUSED:         'control:paused',    // {}
  RESUMED:        'control:resumed',   // {}
  SKIPPED:        'control:skipped',   // { fromPhase, toPhase }

  // Audio
  AUDIO_ERROR:    'audio:error',       // { error }
  AUDIO_READY:    'audio:ready',       // {}
}
```

### Cada actor se suscribe a lo que le interesa

```js
// src/utils/audioActor.js — El audio solo escucha eventos, no conoce al timer

export function createAudioActor(mediator, audioPlayer, config) {
  const unsubscribers = []

  // Cuando cambia la fase → sincronizar audio
  unsubscribers.push(
    mediator.on(EVENTS.PHASE_CHANGED, ({ phase, round }) => {
      if (phase === 'work') {
        audioPlayer.seekTo(config.getWorkOffset(round))
        audioPlayer.play()
      } else if (phase === 'rest') {
        audioPlayer.seekTo(config.getRestOffset(round))
        audioPlayer.play()
      }
    })
  )

  // Cuando se pausa → pausar audio
  unsubscribers.push(
    mediator.on(EVENTS.PAUSED, () => audioPlayer.pause())
  )

  // Cuando se reanuda → reanudar audio
  unsubscribers.push(
    mediator.on(EVENTS.RESUMED, () => audioPlayer.play())
  )

  // Cuando termina → parar audio
  unsubscribers.push(
    mediator.on(EVENTS.WORKOUT_FINISH, () => audioPlayer.stop())
  )

  // Cleanup
  return () => unsubscribers.forEach(fn => fn())
}
```

```js
// src/utils/persistenceActor.js — Guarda estado, no conoce al timer ni al audio

export function createPersistenceActor(mediator, storageKey) {
  const unsubscribers = []

  unsubscribers.push(
    mediator.on(EVENTS.PAUSED, () => {
      // Guardar estado actual para restaurar
      saveState(storageKey, mediator.lastState)
    })
  )

  unsubscribers.push(
    mediator.on(EVENTS.WORKOUT_FINISH, () => {
      clearState(storageKey)
    })
  )

  return () => unsubscribers.forEach(fn => fn())
}
```

```js
// Agregar haptic feedback en el futuro es trivial — no tocas nada existente
export function createHapticActor(mediator) {
  return mediator.on(EVENTS.PHASE_CHANGED, ({ phase }) => {
    if (phase === 'work') navigator.vibrate?.(200)
    if (phase === 'rest') navigator.vibrate?.([100, 50, 100])
  })
}
```

### Conexión en el componente

```js
// src/hooks/useWorkoutMediator.js
import { useRef, useEffect } from 'preact/hooks'
import { createWorkoutMediator } from '../utils/workoutMediator'
import { createAudioActor } from '../utils/audioActor'
import { createPersistenceActor } from '../utils/persistenceActor'

export function useWorkoutMediator(config, audioPlayer) {
  const mediator = useRef(null)

  useEffect(() => {
    const m = createWorkoutMediator()
    mediator.current = m

    // Conectar actores
    const cleanupAudio = createAudioActor(m, audioPlayer, config)
    const cleanupPersistence = createPersistenceActor(m, config.storageKey)

    return () => {
      cleanupAudio()
      cleanupPersistence()
      m.destroy()
    }
  }, [config, audioPlayer])

  return mediator.current
}

// En el timer, solo emites eventos
function onPhaseChange(newPhase, round) {
  mediator.emit(EVENTS.PHASE_CHANGED, { phase: newPhase, round })
}
```

## Refactoring necesario en esta app

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| **Nuevo:** `src/utils/workoutMediator.js` | Event bus + EVENTS enum |
| **Nuevo:** `src/utils/audioActor.js` | Lógica de audio como actor independiente |
| **Nuevo:** `src/utils/persistenceActor.js` | Persistencia como actor independiente |
| **Nuevo:** `src/hooks/useWorkoutMediator.js` | Hook que inicializa mediator + actores |
| `src/hooks/useAudioSync.js` | **Eliminar** — la lógica se mueve a audioActor |
| `src/hooks/useWorkoutTimer.js` | Emitir eventos en vez de llamar audio/storage directamente |
| `src/components/WorkoutTimer.jsx` | Inicializar mediator, simplificar useEffects |

### Líneas de código estimadas

- **Nuevo código:** ~150 líneas (mediator + 2 actores + hook)
- **Código eliminado:** ~200 líneas (useAudioSync + lógica de coordinación dispersa)
- **Neto:** reducción + mejor separación de responsabilidades

### Lo que NO cambia

- `audioUtils.js` — el player mismo no cambia, solo quién lo llama
- La UI y los controles visuales
- Las configuraciones de HIIT/Tabata

## Diferencia con Observer

El Mediator y el Observer son similares pero:

| Observer | Mediator |
|---|---|
| A se suscribe a B directamente | A y B se suscriben al Mediator |
| A sabe que B existe | A no sabe que B existe |
| Relación 1-a-muchos | Relación muchos-a-muchos via intermediario |
| Bueno para 2 actores | Bueno para 3+ actores |

En esta app, con Timer + Audio + Persistence + (futuro) Haptics + (futuro) Analytics, el Mediator es la opción correcta.

## Para profundizar

- **Event Emitter** de Node.js es un Mediator
- **DOM Events** (addEventListener) son un Mediator donde el DOM es el intermediario
- En arquitectura backend, **Message Brokers** (RabbitMQ, Kafka) son Mediators a escala
- **Pub/Sub** es el nombre alternativo cuando el Mediator no tiene lógica propia

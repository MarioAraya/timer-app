# Offline Queue — Cola de Reintentos Offline

## Qué es

Una cola que **almacena acciones fallidas** (generalmente por falta de red) y las **reintenta automáticamente** cuando la conexión vuelve. Es el patrón que hace que una PWA funcione como una app nativa real.

```
   Usuario completa workout (sin red)
              │
              ▼
   ┌────────────────────┐
   │  api.progress.save │──→ fetch() falla (offline)
   └────────────────────┘              │
                                       ▼
                              ┌─────────────────┐
                              │  Offline Queue   │
                              │  (localStorage)  │
                              │  ┌─────────────┐ │
                              │  │ POST /prog. │ │
                              │  │ POST /prog. │ │
                              │  │ POST /like  │ │
                              │  └─────────────┘ │
                              └─────────────────┘
                                       │
             navigator.onLine = true   │
                                       ▼
                              Reenvía todo en orden
                              ┌─────────────────┐
                              │ ✓ POST /prog.   │
                              │ ✓ POST /prog.   │
                              │ ✓ POST /like    │
                              └─────────────────┘
```

## El problema que resuelve

```js
// ❌ Sin offline queue — datos se pierden
const onFinish = async () => {
  try {
    await api.progress.save(workoutData)
    // ✓ Si hay red, funciona
  } catch (err) {
    console.error('No se pudo guardar', err)
    // ✗ El usuario acaba de hacer 12 rondas de HIIT
    //   y su progreso se pierde porque estaba en el metro
    //   → No hay segunda oportunidad
  }
}
```

Para una PWA de fitness esto es especialmente grave:
- El usuario hace ejercicio en el gimnasio, en la calle, en el metro — sitios con mala señal.
- Completar un workout toma esfuerzo real. Perder ese registro es frustrante.
- El streak (racha de días consecutivos) se rompe si la sesión no se registra.

## Cuándo usarlo

- Cuando tu app **funciona offline** (PWA, mobile).
- Cuando hay **acciones de escritura** que el usuario no debería repetir si fallan.
- Cuando **perder datos es inaceptable** desde la perspectiva del usuario.
- Cuando la acción es **idempotente o puede serlo** (guardar progreso, dar like).

**Señales de que lo necesitas:**
- Tu service worker cachea assets pero no tienes estrategia para writes.
- Los `catch` de tus fetch simplemente hacen `console.error`.
- Usuarios reportan "hice mi rutina pero no aparece en mi historial".

**Cuándo NO usarlo:**
- Para operaciones de lectura (no hay nada que "reintentar" — solo muestra datos cacheados).
- Para acciones donde el orden estricto importa entre usuarios (ej. transacciones financieras).
- Si la latencia del reintento es inaceptable (necesitas respuesta inmediata del servidor).

## Cómo se implementa

### La cola en localStorage

```js
// src/lib/offlineQueue.js

const QUEUE_KEY = 'timer_app_offline_queue'

// Leer la cola actual
function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

// Guardar la cola
function setQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

// Agregar un request fallido a la cola
export function enqueue(method, path, body) {
  const queue = getQueue()
  queue.push({
    id: crypto.randomUUID(),
    method,
    path,
    body,
    createdAt: Date.now(),
    retries: 0,
  })
  setQueue(queue)
}

// Procesar todos los pendientes
export async function flush(httpClient) {
  const queue = getQueue()
  if (queue.length === 0) return

  const remaining = []

  for (const item of queue) {
    try {
      await httpClient.request(item.method, item.path, item.body)
      // ✓ Éxito — no lo devolvemos a la cola
    } catch (err) {
      item.retries++

      // Descartar después de demasiados reintentos o si es muy viejo (24h)
      const tooOld = Date.now() - item.createdAt > 24 * 60 * 60 * 1000
      const tooManyRetries = item.retries >= 5

      if (!tooOld && !tooManyRetries) {
        remaining.push(item)
      }
    }
  }

  setQueue(remaining)
}

// ¿Hay pendientes?
export function pendingCount() {
  return getQueue().length
}
```

### Integración con el cliente HTTP

```js
// src/lib/http.js — Modificar el cliente existente

import { enqueue, flush } from './offlineQueue'

async function request(method, path, body) {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeaders()),
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new ApiError(res.status, error.error || res.statusText)
    }

    return res.status === 204 ? null : res.json()
  } catch (err) {
    // Si es un error de red (no un 4xx/5xx) y es un write → encolar
    if (isNetworkError(err) && method !== 'GET') {
      enqueue(method, path, body)
      return { _queued: true }  // Señal para el UI
    }
    throw err
  }
}

function isNetworkError(err) {
  return err instanceof TypeError && err.message.includes('fetch')
    || !navigator.onLine
}
```

### Listener de reconexión

```js
// src/hooks/useOfflineSync.js

import { useEffect } from 'preact/hooks'
import { flush, pendingCount } from '../lib/offlineQueue'
import { http } from '../lib/http'

export function useOfflineSync() {
  useEffect(() => {
    // Intentar enviar pendientes cuando vuelve la red
    const handleOnline = async () => {
      const count = pendingCount()
      if (count > 0) {
        console.log(`Reenviando ${count} acciones pendientes...`)
        await flush(http)
      }
    }

    window.addEventListener('online', handleOnline)

    // También intentar al montar (por si la app se cerró offline y reabrió online)
    if (navigator.onLine) {
      handleOnline()
    }

    return () => window.removeEventListener('online', handleOnline)
  }, [])
}
```

### Feedback al usuario

```js
// En App.jsx — mostrar indicador de pendientes
import { useOfflineSync } from './hooks/useOfflineSync'
import { pendingCount } from './lib/offlineQueue'

function App() {
  useOfflineSync()

  // Indicador visual de que hay acciones pendientes
  const pending = pendingCount()

  return (
    <div className="app">
      {pending > 0 && (
        <div className="pending-indicator" title={`${pending} acciones pendientes`}>
          <span className="material-symbols-outlined">cloud_upload</span>
          {pending}
        </div>
      )}
      {/* ... */}
    </div>
  )
}
```

### Uso transparente en componentes

```js
// El componente NO necesita saber sobre la cola
// La api.progress.save() encola automáticamente si no hay red

const onFinish = async () => {
  if (!session) return

  const result = await api.progress.save({
    routine_id:       config.id,
    routine_type:     config.type,
    rounds_completed: round,
    total_rounds:     totalRounds,
    completed:        true,
  })

  if (result?._queued) {
    // Opcional: mostrar toast "Se guardará cuando vuelvas a tener red"
  }
}
```

## Refactoring necesario en esta app

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| **Nuevo:** `src/lib/offlineQueue.js` | Cola en localStorage + flush |
| **Nuevo:** `src/hooks/useOfflineSync.js` | Listener de `online` + auto-flush |
| `src/lib/http.js` | Encolar writes fallidos por error de red |
| `src/app.jsx` | Agregar `useOfflineSync()` + indicador de pendientes |

### Líneas de código estimadas

- **Nuevo código:** ~80 líneas (offlineQueue.js + hook)
- **Código modificado:** ~15 líneas en http.js
- **Beneficio:** 0 pérdida de datos en sesiones offline

### Lo que NO cambia

- Los componentes que usan `api.*` (la cola es transparente)
- El backend Go (recibe los requests normales, solo más tarde)
- El service worker (sigue cacheando assets como antes)

## Consideraciones importantes

### Idempotencia

Si el flush reenvía una acción que sí llegó al servidor (pero el response se perdió), se puede duplicar. Soluciones:

```js
// Opción 1: El backend ignora duplicados (UNIQUE constraint en DB)
// La tabla progress tiene id UUID generado por el frontend:
{
  id: crypto.randomUUID(),  // Mismo ID en reintentos → DB rechaza duplicado
  routine_id: '...',
  // ...
}

// Opción 2: El backend tiene un endpoint idempotente
// PUT /api/progress/{id}  en vez de  POST /api/progress
```

### Conflictos

Para esta app, los conflictos son poco probables porque:
- El progreso es **append-only** (solo se agregan sesiones, no se editan).
- Los likes son **idempotentes** (dar like dos veces = un like).
- Las rutinas se editan por un solo usuario (el dueño).

### Service Worker como alternativa

El service worker puede interceptar requests fallidos con la **Background Sync API**:

```js
// sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(flushQueue())
  }
})
```

Esto es más robusto (funciona aunque la app esté cerrada), pero Background Sync no está disponible en todos los browsers. La cola en localStorage funciona en todos.

## Para profundizar

- **Workbox Background Sync** — librería de Google para esto con Service Workers
- **Outbox Pattern** — la versión enterprise de este patrón (usado en microservicios)
- **Eventual Consistency** — el modelo de consistencia que subyace a las colas offline
- **Optimistic UI** — mostrar el resultado como exitoso inmediatamente, revertir si falla

# Adapter — Patrón Adaptador

## Qué es

El Adapter envuelve una interfaz para que sea compatible con otra. Es un **traductor** entre dos partes del sistema que hablan "idiomas" diferentes.

```
  Tu componente           Adapter               Servicio externo
  ─────────────          ─────────              ─────────────────

  api.routines.list()  →  fetch('/api/routines')  →  Backend Go
  api.routines.list()  →  supabase.from('routines').select()  →  Supabase directo
  api.routines.list()  →  return mockData  →  Tests / desarrollo offline
                ↑
          Misma interfaz
       (tu código no cambia)
```

## El problema que resuelve

Sin adapter, tu frontend se acopla directamente al servicio:

```js
// ❌ Acoplamiento directo — si cambias de backend, tocas 15 archivos
// En WorkoutTimer.jsx:
const onFinish = async () => {
  await fetch(`${import.meta.env.VITE_API_URL}/api/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      routine_id: config.id,
      routine_type: 'hiit',
      rounds_completed: round,
      total_rounds: totalRounds,
      active_seconds: elapsed,
      total_seconds: totalTime,
      completed: true,
    }),
  })
}

// En TimersHome.jsx:
const loadPresets = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/presets`)
  const data = await res.json()
  // ...
}

// La misma URL base, headers, y manejo de errores se repite en cada componente
```

Problemas:
- **Repetición:** URL base, headers de auth, y manejo de errores se copian en cada llamada.
- **Acoplamiento:** si cambias de Go backend a llamar Supabase directo, tocas todos los componentes.
- **Sin tipado:** cada fetch construye el body manualmente; fácil cometer typos.
- **Difícil de testear:** no puedes mockear las llamadas fácilmente.

## Cuándo usarlo

- Cuando **consumes un servicio externo** (API, SDK, librería de terceros).
- Cuando quieres poder **cambiar de proveedor** sin reescribir el frontend.
- Cuando **múltiples componentes** hacen llamadas al mismo servicio.
- Cuando necesitas **mockear servicios** para tests o desarrollo offline.

**Señales de que lo necesitas:**
- Escribes `fetch()` con headers de auth en más de 2 archivos.
- Tienes `import.meta.env.VITE_API_URL` regado por todo el código.
- Quieres probar la UI sin un backend corriendo.

## Cómo se implementa

### Capa base de HTTP

```js
// src/lib/http.js — Cliente HTTP reutilizable con auth automática

import supabase from './supabase'

const API_URL = import.meta.env.VITE_API_URL || ''

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

async function request(method, path, body) {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeaders()),
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiError(res.status, error.error || 'Error desconocido')
  }

  if (res.status === 204) return null
  return res.json()
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const http = {
  get:    (path)       => request('GET', path),
  post:   (path, body) => request('POST', path, body),
  put:    (path, body) => request('PUT', path, body),
  delete: (path)       => request('DELETE', path),
}
```

### El Adapter propiamente dicho

```js
// src/lib/api.js — Interfaz limpia que consume tu código

import { http } from './http'

export const api = {
  // ── Presets (sin auth) ──────────────────────────────────
  presets: {
    list: (type) =>
      http.get(`/api/presets${type ? `?type=${type}` : ''}`),

    get: (id) =>
      http.get(`/api/presets/${id}`),
  },

  // ── Rutinas del usuario (requiere auth) ─────────────────
  routines: {
    list: () =>
      http.get('/api/routines'),

    create: (data) =>
      http.post('/api/routines', data),

    update: (id, data) =>
      http.put(`/api/routines/${id}`, data),

    delete: (id) =>
      http.delete(`/api/routines/${id}`),

    clone: (id) =>
      http.post(`/api/routines/${id}/clone`),
  },

  // ── Rutinas públicas ────────────────────────────────────
  community: {
    list: (type, tag) => {
      const params = new URLSearchParams()
      if (type) params.set('type', type)
      if (tag) params.set('tag', tag)
      const qs = params.toString()
      return http.get(`/api/routines/public${qs ? `?${qs}` : ''}`)
    },

    byUser: (userId) =>
      http.get(`/api/users/${userId}/routines`),
  },

  // ── Social ──────────────────────────────────────────────
  social: {
    like:   (routineId) => http.post(`/api/routines/${routineId}/like`),
    unlike: (routineId) => http.delete(`/api/routines/${routineId}/like`),
    status: (routineId) => http.get(`/api/routines/${routineId}/like`),
  },

  // ── Progreso ────────────────────────────────────────────
  progress: {
    save: (entry) =>
      http.post('/api/progress', entry),

    list: (limit = 50) =>
      http.get(`/api/progress?limit=${limit}`),

    stats: () =>
      http.get('/api/progress/stats'),
  },
}
```

### Uso en componentes

```js
// Antes: fetch manual con headers, URL, body, error handling...
// Después: una línea clara

import { api } from '../lib/api'

// Guardar progreso al terminar un workout
const onFinish = async () => {
  if (!session) return  // usuarios anónimos no guardan

  await api.progress.save({
    routine_id:       config.id,
    routine_type:     config.type,
    routine_title:    config.title,
    rounds_completed: round,
    total_rounds:     totalRounds,
    active_seconds:   elapsed,
    total_seconds:    totalTime,
    completed:        true,
  })
}

// Cargar presets
const presets = await api.presets.list('hiit')

// Dar like
await api.social.like(routineId)

// Obtener stats
const stats = await api.progress.stats()
```

### Adapter para desarrollo offline / tests

```js
// src/lib/api.mock.js — Para desarrollo sin backend

const mockPresets = [
  { id: '1', type: 'hiit', title: 'HIIT Clásico', /* ... */ },
  { id: '2', type: 'tabata', title: 'Tabata Estándar', /* ... */ },
]

export const api = {
  presets: {
    list: () => Promise.resolve(mockPresets),
    get: (id) => Promise.resolve(mockPresets.find(p => p.id === id)),
  },
  progress: {
    save: (entry) => { console.log('Mock save:', entry); return Promise.resolve(entry) },
    list: () => Promise.resolve([]),
    stats: () => Promise.resolve({ total_sessions: 0, current_streak: 0 }),
  },
  // ... etc
}
```

```js
// Cambiar entre real y mock — un solo import cambia
// src/lib/api.js (al inicio):
const USE_MOCK = !import.meta.env.VITE_API_URL

import { api as realApi } from './api.real'
import { api as mockApi } from './api.mock'

export const api = USE_MOCK ? mockApi : realApi
```

## Refactoring necesario en esta app

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| **Nuevo:** `src/lib/http.js` | Cliente HTTP base con auth automática |
| **Nuevo:** `src/lib/api.js` | Adapter con interfaz limpia |
| **Nuevo (opc):** `src/lib/api.mock.js` | Mock para desarrollo offline |
| `src/components/WorkoutTimer.jsx` | Usar `api.progress.save()` en onFinish |
| `src/components/TimersHome.jsx` | (Futuro) cargar presets desde `api.presets.list()` |

### Líneas de código estimadas

- **Nuevo código:** ~100 líneas (http.js + api.js)
- **Código modificado:** ~10 líneas por componente que consume la API
- **Mock opcional:** ~40 líneas

### Lo que NO cambia

- El backend Go (es el "servicio externo" que el adapter envuelve)
- Los componentes de UI (solo cambia cómo llaman al backend)
- El auth (el adapter lee el token de Supabase automáticamente)

## Variantes comunes

### Adapter para librerías de terceros

El mismo patrón aplica para aislar dependencias de npm:

```js
// ❌ Acoplar tu código directamente a la librería
import confetti from 'canvas-confetti'
confetti({ particleCount: 100 })

// ✅ Adapter que puedes cambiar o mockear
// src/lib/effects.js
import confetti from 'canvas-confetti'

export const effects = {
  celebrate: () => confetti({ particleCount: 100, spread: 70 }),
  fireworks: () => confetti({ particleCount: 200, startVelocity: 30 }),
}

// Si mañana cambias canvas-confetti por otra lib, solo tocas effects.js
```

### Adapter para localStorage

Ya existe implícitamente en `src/utils/localStorage.js` — las funciones `saveHiitState()` / `loadHiitState()` son adapters sobre `window.localStorage`.

## Para profundizar

- **Ports and Adapters** (Hexagonal Architecture) — el Adapter es la pieza central
- **Anti-Corruption Layer** (DDD) — Adapter entre tu dominio y sistemas legacy
- **Facade** vs **Adapter**: Facade simplifica; Adapter traduce interfaces incompatibles
- En el backend Go, `internal/db/supabase.go` ya es un Adapter sobre PostgREST

# Calibración HIIT — "Next Level" (40/20 ×12)

MP3: `hiit_next-level_40-20_x12.mp3`
Medido: 2026-08-10 · Método: tecla SPACE en la app (`handleCalibrate` → `hiitAudio.getPosition()`)

**Estos tiempos valen solo para esta canción.** Si se cambia el MP3, todo este
documento y la config derivada quedan inválidos y hay que recalibrar.

## Marcas crudas

Tiempos absolutos del MP3 (`audio.currentTime`), en segundos. La última marca es
el fin del track, no un round 13.

```js
{ time: 0,       phase: 'prep' },
{ time: 10.315,  phase: 'work', round: 1 },
{ time: 51.284,  phase: 'rest', round: 1 },
{ time: 71.718,  phase: 'work', round: 2 },
{ time: 112.520, phase: 'rest', round: 2 },
{ time: 133.004, phase: 'work', round: 3 },
{ time: 173.892, phase: 'rest', round: 3 },
{ time: 194.202, phase: 'work', round: 4 },
{ time: 235.118, phase: 'rest', round: 4 },
{ time: 255.517, phase: 'work', round: 5 },
{ time: 296.446, phase: 'rest', round: 5 },
{ time: 316.842, phase: 'work', round: 6 },
{ time: 357.701, phase: 'rest', round: 6 },
{ time: 378.188, phase: 'work', round: 7 },
{ time: 418.955, phase: 'rest', round: 7 },
{ time: 439.409, phase: 'work', round: 8 },
{ time: 480.233, phase: 'rest', round: 8 },
{ time: 500.674, phase: 'work', round: 9 },
{ time: 541.557, phase: 'rest', round: 9 },
{ time: 561.970, phase: 'work', round: 10 },
{ time: 602.820, phase: 'rest', round: 10 },
{ time: 623.311, phase: 'work', round: 11 },
{ time: 664.090, phase: 'rest', round: 11 },
{ time: 684.560, phase: 'work', round: 12 },
{ time: 725.629, phase: 'rest', round: 12 },
{ time: 747.027, phase: 'end' }
```

## Duraciones derivadas

| Round | Work | Rest |
|------:|-----:|-----:|
| 1  | 40.969 | 20.434 |
| 2  | 40.802 | 20.484 |
| 3  | 40.888 | 20.310 |
| 4  | 40.916 | 20.399 |
| 5  | 40.929 | 20.396 |
| 6  | 40.859 | 20.487 |
| 7  | 40.767 | 20.454 |
| 8  | 40.824 | 20.441 |
| 9  | 40.883 | 20.413 |
| 10 | 40.850 | 20.491 |
| 11 | 40.779 | 20.470 |
| 12 | 41.069 | 21.398 ← outro hasta el fin del MP3 |

|  | avg | min | max |
|---|---:|---:|---:|
| Work | 40.878 | 40.767 | 41.069 |
| Rest | 20.515 | 20.310 | 21.398 |

Sin contar el outro del round 12, el descanso va de 20.310 a 20.491 — una
ventana de 181 ms en doce rounds.

## Lo que dice el dato

**La canción no es 40/20, es ~40.9/20.4.** El nombre del archivo miente por
casi un segundo por fase. Forzar 40.00 y 20.00 en la config acumula ~1.4s de
error por round: para el round 12 el timer va más de 15 segundos adelantado
respecto de la música.

Esto invalida dos cosas que había antes en `hiitConfig.js`:

- Los rounds 7 a 12 estaban puestos como `work: 40.00 / rest: 20.00` "estándar",
  inventados, no medidos. Los reales rondan 40.8 / 20.45.
- El round 1 figuraba con `work: 38.74`, que salía de restar marcas viejas
  (12.589 → 51.284). La marca de inicio real es 10.315, no 12.589, así que el
  round 1 siempre midió ~41s como todos los demás. El parche que compensaba
  acortando la preparación a 9.74s deja de tener razón de ser.

## Preparación y el offset de audio

`HIIT_AUDIO_CONFIG.startTime = 1.37`: al arrancar, el MP3 se posiciona en 1.37s,
no en 0. Entonces el timer en `t=0` corresponde al audio en 1.37.

```
prep_timer = tick_primer_work − startTime = 10.315 − 1.37 = 8.945
```

**Esta resta aplica solo a la preparación.** Las demás duraciones son diferencias
entre marcas consecutivas, y el offset se cancela.

Total del workout: 745.657s = **12:25**, que coincide con el fin del MP3 (747.027
− 1.37), como tiene que ser.

## Cómo recalibrar

1. HIIT en **modo Música** (en beeps no hay MP3 que medir).
2. SPACE en cada transición que se escuche en la canción — alterna work/rest solo.
3. La consola reimprime el bloque `HIIT_TICKS` completo en cada marca; al terminar
   se copia el último.
4. Marcar el fin del MP3 como última pulsación.

Marcar cuando cambia **la música**, no cuando cambia el timer en pantalla: si se
sigue la pantalla, la medición solo devuelve la config que ya estaba puesta.

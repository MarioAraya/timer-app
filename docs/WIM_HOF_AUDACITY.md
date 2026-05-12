# Wim Hof Breathing — Audacity tick extraction

Guide to extract phase-transition timestamps from `dist/win_hof_4rounds.mp3` and convert them into a `wimHofTicks.js` config compatible with the existing ticks engine (`src/utils/ticksEngine.js`).

## 0. Why manual marking

The narrator voice varies across rounds (counts, pauses, inhalation cues). Whisper-style ASR is overkill — sub-second precision is achievable by hand in ~10 minutes for the 4-round track. Use WhisperX only if you later need per-breath beep alignment inside each round.

## 1. Install Audacity

```bash
brew install --cask audacity
```

Open file: `~/dev/timer-app/dist/win_hof_4rounds.mp3` (File → Open, or drag-drop into the empty window).

## 2. Marking workflow

Key shortcut: **`⌘+B`** (macOS) creates a label at the current playhead position.

| Action | Shortcut |
|---|---|
| Play / pause | `Space` |
| Add label at playhead | `⌘+B` |
| Confirm label name | `Enter` |
| Zoom in | `⌘+1` |
| Zoom out | `⌘+3` |
| Zoom to selection | `⌘+E` |
| Nudge playhead 1 frame | `←` `→` |
| Loop selection | `Shift+Space` |

Procedure:

1. Press `Space` to play.
2. When you hear a phase transition cue (e.g. *"now let it all go and hold"*), press `Space` to pause.
3. Press `⌘+B` to insert a label at the playhead.
4. Type the label name (see naming convention below) and press `Enter`.
5. Continue playback. Repeat until end of track.

A separate **label track** appears beneath the waveform. Drag any label horizontally to fine-tune. Double-click a label name to rename.

## 3. Naming convention

Use `<phase>_<roundTag>` snake_case. The converter script splits on `_`.

```
intro                  ← track start / first instructions
breathe_r1             ← start of 30-40 fast breaths, round 1
hold_r1                ← exhale + breath retention, round 1
recovery_r1            ← deep inhale + 15s hold, round 1
breathe_r2
hold_r2
recovery_r2
breathe_r3
hold_r3
recovery_r3
breathe_r4
hold_r4
recovery_r4
end                    ← outro / completion message
```

Minimum 13 labels for 4 rounds (intro + 3×4 + end). Add optional intermediate labels (e.g. `countdown_r1`) only if the UI needs them.

## 4. Export labels

`File → Export → Export Labels…`

Save as `wim_hof_labels.txt` (e.g. inside `scripts/`). Format is tab-separated:

```
12.347000	12.347000	intro
45.821000	45.821000	breathe_r1
98.456000	98.456000	hold_r1
160.012000	160.012000	recovery_r1
...
```

Columns: `start \t end \t label`. For point labels, `start == end`.

## 5. Convert to JS ticks

Create `scripts/labels-to-ticks.mjs`:

```js
import fs from 'node:fs';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('usage: node scripts/labels-to-ticks.mjs <labels.txt>');
  process.exit(1);
}

const ticks = fs
  .readFileSync(inputPath, 'utf8')
  .trim()
  .split('\n')
  .map((line) => {
    const [start, , label] = line.split('\t');
    const [phase, roundTag] = label.split('_');
    const round = roundTag?.startsWith('r') ? Number(roundTag.slice(1)) : undefined;
    return { t: Number(parseFloat(start).toFixed(3)), phase, ...(round ? { round } : {}) };
  });

const out = `// Auto-generated from Audacity labels. Do not edit by hand.\nexport const wimHofTicks = ${JSON.stringify(ticks, null, 2)};\n`;
process.stdout.write(out);
```

Run:

```bash
node scripts/labels-to-ticks.mjs scripts/wim_hof_labels.txt > src/config/wimHofTicks.js
```

## 6. Integrate with ticksEngine

Mirror the existing pattern (`src/config/hiitTicks.js` → `src/config/hiitConfig.js` via `buildConfigFromTicks()`):

```js
// src/config/wimHofConfig.js
import { wimHofTicks } from './wimHofTicks.js';
import { buildConfigFromTicks } from '../utils/ticksEngine.js';

export const wimHofConfig = buildConfigFromTicks(wimHofTicks);
```

The engine derives durations from tick deltas — no hardcoded numbers.

## 7. Sanity check

After generating ticks, run:

```bash
node -e "import('./src/config/wimHofConfig.js').then(m => console.log(JSON.stringify(m.wimHofConfig, null, 2)))"
```

Validate:
- Round 1, 2, 3, 4 hold durations should grow progressively (typical Wim Hof: 60s → 90s → 120s → 150s).
- Each `recovery` lasts ~15s.
- Each `breathe` is ~60-90s (depends on 30 vs 40 rep count).

If a duration looks wrong, reopen Audacity, locate the offending label, drag to correct position, re-export, regenerate.

## 8. Wire into UI

1. Create `src/components/breath/WimHofTimer.jsx` — start by copying `BreathingTimer.jsx` and swapping the phases array for one driven by `wimHofConfig`.
2. Register in `src/components/TimersHome.jsx` grid.
3. Add case `'WimHofTimer'` in `src/app.jsx` `currentView` switch.
4. Add i18n keys in `src/i18n/es.js` and `src/i18n/en.js`.
5. Use `breathingAudio` (`LofiPlaylistPlayer`) or create a dedicated `WimHofAudioPlayer` if you need MP3 sync with the same watchdog pattern as `WorkoutAudioPlayer`.

## 9. References

- Ticks engine: `src/utils/ticksEngine.js`
- Existing tick files: `src/config/hiitTicks.js`, `src/config/tabataTicks.js`
- Audio player base: `src/utils/WorkoutAudioPlayer.js`
- Breathing base component: `src/components/breath/BreathingTimer.jsx`
- Feature definition: `features.json`

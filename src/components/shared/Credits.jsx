import { useState } from 'preact/hooks';
import './Credits.scss';

export default function Credits() {
  const [open, setOpen] = useState(false);

  return (
    <section class="credits">
      <button
        class="credits__toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <i class={`credits__chevron${open ? ' credits__chevron--open' : ''}`}>▾</i>
        Music Credits
      </button>

      <div class={`credits__body${open ? ' credits__body--open' : ''}`}>
        <div class="credits__inner">
          <div class="credits__content">
            <h4>Lofi / Pomodoro</h4>
            <p>
              Music from{' '}
              <a href="https://pixabay.com/music/" target="_blank" rel="noopener">Pixabay</a>
              {' '}— Free to use under the{' '}
              <a href="https://pixabay.com/service/license-summary/" target="_blank" rel="noopener">
                Pixabay Content License
              </a>.
            </p>
            <ul>
              <li>FASounds — Lofi Study Calm Peaceful Chill Hop</li>
              <li>FASounds — Good Night Lofi Cozy Chill Music</li>
              <li>PulseBox — Lofi Melody</li>
              <li>PulseBox — Lofi Night</li>
              <li>PulseBox — Lofi Smooth</li>
              <li>MondaMusic — Lofi Girl Lofi Chill</li>
              <li>Lofi Music Library — Lofi Ambient Study</li>
              <li>LofiDreams — Cozy Lofi Background Music for Study</li>
            </ul>

            <h4>Tabata</h4>
            <p>
              Music by{' '}
              <a href="https://www.youtube.com/@TabataSongs" target="_blank" rel="noopener">
                Tabata Songs
              </a>.
            </p>

            <h4>HIIT</h4>
            <p>
              Music by{' '}
              <a href="https://www.youtube.com/@HIITMUSIC" target="_blank" rel="noopener">
                HIIT MUSIC
              </a>.
            </p>

            <h4>Wim Hof</h4>
            <p>
              Breathing method by{' '}
              <a href="https://www.wimhofmethod.com" target="_blank" rel="noopener">
                Wim Hof
              </a>
              {' '}(The Iceman). Audio guidance for educational and wellness purposes only.
              Wim Hof Method® is a registered trademark of Wim Hof.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

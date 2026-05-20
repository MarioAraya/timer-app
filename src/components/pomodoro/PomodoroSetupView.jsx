import { useState } from 'preact/hooks'
import { useLang } from '../../context/LanguageContext'
import { POMODORO_PRESETS } from '../../config/pomodoroConfig'
import './PomodoroSetupView.scss'

const formatMin = (seconds) => `${Math.round(seconds / 60)} min`

const sliderFill = (value, min, max) => ((value - min) / (max - min)) * 100

function PomodoroSetupView({ onStart, onBackClick }) {
  const { t } = useLang()
  const [selectedId, setSelectedId] = useState('popular')
  const [customWork, setCustomWork] = useState(15)
  const [customShortBreak, setCustomShortBreak] = useState(8)
  const [customLongBreak, setCustomLongBreak] = useState(10)

  const handleStart = () => {
    let config
    if (selectedId === 'custom') {
      const base = POMODORO_PRESETS.find(p => p.id === 'custom')
      config = {
        ...base,
        workDuration: customWork * 60,
        shortBreakDuration: customShortBreak * 60,
        longBreakDuration: customLongBreak * 60,
      }
    } else {
      config = POMODORO_PRESETS.find(p => p.id === selectedId)
    }
    onStart(config)
  }

  const presetLabels = {
    baby:     { es: 'Paso de bebé',  en: 'Baby Steps'  },
    popular:  { es: 'Popular',       en: 'Popular'     },
    medium:   { es: 'Medio',         en: 'Medium'      },
    extended: { es: 'Extendido',     en: 'Extended'    },
    custom:   { es: 'Personalizado', en: 'Custom'      },
  }

  return (
    <div className="pomodoro-setup-view">
      <header className="psetup-header">
        {onBackClick && (
          <button className="back-button" onClick={onBackClick}>
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
        )}
        <h2 className="psetup-title">{t('pomodoro.setup.title')}</h2>
        <div className="psetup-header-spacer" />
      </header>

      <main className="psetup-main">
        <p className="psetup-subtitle">{t('pomodoro.setup.subtitle')}</p>

        <div className="psetup-presets">
          {POMODORO_PRESETS.map((preset) => {
            const isSelected = selectedId === preset.id
            return (
              <button
                key={preset.id}
                className={`psetup-preset-row ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedId(preset.id)}
              >
                <div className={`psetup-radio ${isSelected ? 'checked' : ''}`}>
                  {isSelected && <div className="psetup-radio-dot" />}
                </div>
                <div className="psetup-preset-info">
                  <span className="psetup-preset-name">{t(`pomodoro.setup.presets.${preset.id}`)}</span>
                  {preset.id !== 'custom' ? (
                    <span className="psetup-preset-times">
                      {formatMin(preset.workDuration)} &bull; {formatMin(preset.shortBreakDuration)} &bull; {formatMin(preset.longBreakDuration)}
                    </span>
                  ) : (
                    <span className="psetup-preset-times">
                      {customWork} min &bull; {customShortBreak} min &bull; {customLongBreak} min
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {selectedId === 'custom' && (
          <div className="psetup-custom-sliders">
            <div className="psetup-slider-row">
              <div className="psetup-slider-header">
                <span className="psetup-slider-value">{customWork} min</span>
                <span className="psetup-slider-label">{t('pomodoro.setup.workLabel')}</span>
              </div>
              <div className="slider-container">
                <input
                  type="range" min="5" max="90" value={customWork}
                  onChange={(e) => setCustomWork(Number(e.target.value))}
                  className="slider work-slider"
                />
                <div className="slider-fill primary" style={{ width: `${sliderFill(customWork, 5, 90)}%` }} />
              </div>
            </div>

            <div className="psetup-slider-row">
              <div className="psetup-slider-header">
                <span className="psetup-slider-value">{customShortBreak} min</span>
                <span className="psetup-slider-label">{t('pomodoro.setup.shortBreakLabel')}</span>
              </div>
              <div className="slider-container">
                <input
                  type="range" min="1" max="30" value={customShortBreak}
                  onChange={(e) => setCustomShortBreak(Number(e.target.value))}
                  className="slider"
                />
                <div className="slider-fill" style={{ width: `${sliderFill(customShortBreak, 1, 30)}%` }} />
              </div>
            </div>

            <div className="psetup-slider-row">
              <div className="psetup-slider-header">
                <span className="psetup-slider-value">{customLongBreak} min</span>
                <span className="psetup-slider-label">{t('pomodoro.setup.longBreakLabel')}</span>
              </div>
              <div className="slider-container">
                <input
                  type="range" min="5" max="60" value={customLongBreak}
                  onChange={(e) => setCustomLongBreak(Number(e.target.value))}
                  className="slider"
                />
                <div className="slider-fill" style={{ width: `${sliderFill(customLongBreak, 5, 60)}%` }} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="psetup-footer">
        <button className="psetup-start-button" onClick={handleStart} data-testid="pomodoro-setup-start">
          <span className="material-symbols-outlined">play_arrow</span>
          {t('setup.startButton')}
        </button>
      </footer>
    </div>
  )
}

export default PomodoroSetupView

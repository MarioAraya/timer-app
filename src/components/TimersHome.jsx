import { useState } from 'preact/hooks'
import './TimersHome.scss'
import UserMenu from './auth/UserMenu'
import { useLang } from '../context/LanguageContext'
import { loadSessionCounts } from '../utils/localStorage'
import Credits from './shared/Credits'

// Breathing techniques merged into a single card — each is reachable via its pattern chip
const BREATHING_VARIANTS = [
  { id: 'box-breathing',  i18nKey: 'boxBreathing',   sessionKey: 'boxBreathing',  pattern: '4-4-4-4', duration: '5 min', icon: 'self_improvement', component: 'BoxBreathingTimer',   accentColor: '#4ecdc4' },
  { id: 'relaxing-breath',i18nKey: 'relaxingBreath', sessionKey: 'relaxingBreath',pattern: '4-7-8',   duration: '3 min', icon: 'nights_stay',      component: 'RelaxingBreathTimer', accentColor: '#9b59b6' },
  { id: 'calming-breath', i18nKey: 'calmingBreath',  sessionKey: 'calmingBreath', pattern: '4-2-6',   duration: '4 min', icon: 'spa',              component: 'CalmingBreathTimer',  accentColor: '#3498db' },
]

const TIMER_STATIC = [
  { id: 'hiit',           i18nKey: 'hiit',           sessionKey: 'hiit',          duration: '12 min',  icon: 'local_fire_department', component: 'HiitTimer',     accentColor: '#00cc88' },
  { id: 'tabata',         i18nKey: 'tabata',         sessionKey: 'tabata',        duration: '4 min',   icon: 'bolt',                  component: 'TabataTimer',   accentColor: '#ff6b35' },
  { id: 'pomodoro',       i18nKey: 'pomodoro',       sessionKey: 'pomodoro',      duration: '25 min',  icon: 'timer',                 component: 'PomodoroTimer', accentColor: '#ff6b6b' },
  { id: 'breathing',      i18nKey: 'breathingGroup', sessionKey: 'boxBreathing',  duration: '3-5 min', icon: 'self_improvement',      component: 'BoxBreathingTimer', accentColor: '#4ecdc4', variants: BREATHING_VARIANTS },
  { id: 'wim-hof',        i18nKey: 'wimHof',         sessionKey: 'wimHof',        duration: '11 min',  icon: 'air',                   component: 'WimHofTimer',   accentColor: '#4ecdc4' },
]

function TimersHome({ onTimerSelect, activeTimer, session, onAuthClick, onSignOut }) {
  const { t, lang, setLang } = useLang()
  const [sessionCounts] = useState(() => loadSessionCounts())

  const localize = (s) => ({
    ...s,
    name:        t(`${s.i18nKey}.name`),
    title:       t(`${s.i18nKey}.title`),
    description: t(`${s.i18nKey}.description`),
    category:    t(`${s.i18nKey}.category`),
    sessions:    sessionCounts[s.sessionKey] || 0,
  })

  const timers = TIMER_STATIC.map(s => ({
    ...localize(s),
    variants: s.variants?.map(localize),
  }))

  return (
    <div className="timers-home">
      <header className="home-header">
        <div className="header-content">
          <span className="header-label">{t('home.heading')}</span>
          <h1 className="header-title">{t('home.subtitle')}</h1>
        </div>
        <div className="header-auth">
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          >
            {t('language.toggle')}
          </button>
          {session && <UserMenu session={session} onSignOut={onSignOut} />}
        </div>
      </header>

      <div className="timers-home__grid">
        {timers.map((timer) => {
          const components = timer.variants
            ? timer.variants.map(v => v.component)
            : [timer.component]
          const isRunning = activeTimer && components.includes(activeTimer.component)

          return (
            <div
              key={timer.id}
              data-testid={`timer-card-${timer.id}`}
              className={`timer-card ${isRunning ? 'timer-card--running' : ''} ${timer.variants ? 'timer-card--group' : ''}`}
              onClick={() => onTimerSelect(timer.variants ? timer.variants[0] : timer)}
              style={{ '--accent-color': timer.accentColor }}
            >
              <div className="timer-card__icon-wrapper">
                <div className="icon-glow"></div>
                <span className="material-symbols-outlined timer-card__icon">{timer.icon}</span>
              </div>

              <div className="timer-card__content">
                <div className="timer-card__badges">
                  <div className="timer-card__category">{timer.category}</div>
                  <div className="timer-card__duration">
                    <span className="material-symbols-outlined">schedule</span>
                    {timer.duration}
                  </div>
                </div>

                <h3 className="timer-card__title">{timer.title}</h3>
                <p className="timer-card__description">{timer.description}</p>

                {timer.variants && (
                  <div className="timer-card__chips" aria-label={t('breathingGroup.chipsLabel')}>
                    {timer.variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        data-testid={`timer-chip-${variant.id}`}
                        className="timer-chip"
                        style={{ '--chip-color': variant.accentColor }}
                        aria-label={`${variant.title} — ${variant.pattern}`}
                        onClick={(e) => { e.stopPropagation(); onTimerSelect(variant) }}
                      >
                        <span className="material-symbols-outlined timer-chip__icon">{variant.icon}</span>
                        <span className="timer-chip__pattern">{variant.pattern}</span>

                        <span className="timer-chip__tooltip" role="tooltip">
                          <span className="timer-chip__tooltip-title">{variant.title}</span>
                          <span className="timer-chip__tooltip-desc">{variant.description}</span>
                          <span className="timer-chip__tooltip-meta">
                            <span className="material-symbols-outlined">schedule</span>
                            {variant.duration}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )
        })}
      </div>
      <footer className="home-footer">
        <Credits />
      </footer>
    </div>
  )
}

export default TimersHome

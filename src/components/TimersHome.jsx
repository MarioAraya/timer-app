import { useState } from 'preact/hooks'
import './TimersHome.scss'
import UserMenu from './auth/UserMenu'
import { useLang } from '../context/LanguageContext'
import { loadSessionCounts } from '../utils/localStorage'
import Credits from './shared/Credits'

const TIMER_STATIC = [
  { id: 'hiit',           i18nKey: 'hiit',           sessionKey: 'hiit',          duration: '12 min', icon: 'local_fire_department', component: 'HiitTimer',          accentColor: '#00cc88' },
  { id: 'tabata',         i18nKey: 'tabata',         sessionKey: 'tabata',        duration: '4 min',  icon: 'bolt',                  component: 'TabataTimer',        accentColor: '#ff6b35' },
  { id: 'pomodoro',       i18nKey: 'pomodoro',       sessionKey: 'pomodoro',      duration: '25 min', icon: 'timer',                 component: 'PomodoroTimer',      accentColor: '#ff6b6b' },
  { id: 'box-breathing',  i18nKey: 'boxBreathing',   sessionKey: 'boxBreathing',  duration: '5 min',  icon: 'self_improvement',      component: 'BoxBreathingTimer',  accentColor: '#4ecdc4' },
  { id: 'relaxing-breath',i18nKey: 'relaxingBreath', sessionKey: 'relaxingBreath',duration: '3 min',  icon: 'nights_stay',           component: 'RelaxingBreathTimer',accentColor: '#9b59b6' },
  { id: 'calming-breath', i18nKey: 'calmingBreath',  sessionKey: 'calmingBreath', duration: '4 min',  icon: 'spa',                   component: 'CalmingBreathTimer', accentColor: '#3498db' },
]

function TimersHome({ onTimerSelect, activeTimer, session, onAuthClick, onSignOut }) {
  const { t, lang, setLang } = useLang()
  const [sessionCounts] = useState(() => loadSessionCounts())

  const timers = TIMER_STATIC.map(s => ({
    ...s,
    name:        t(`${s.i18nKey}.name`),
    title:       t(`${s.i18nKey}.title`),
    description: t(`${s.i18nKey}.description`),
    category:    t(`${s.i18nKey}.category`),
    sessions:    sessionCounts[s.sessionKey] || 0,
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
          const isRunning = activeTimer && activeTimer.component === timer.component

          return (
            <div
              key={timer.id}
              data-testid={`timer-card-${timer.id}`}
              className={`timer-card ${isRunning ? 'timer-card--running' : ''}`}
              onClick={() => onTimerSelect(timer)}
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

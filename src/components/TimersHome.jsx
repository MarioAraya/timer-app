import './TimersHome.scss'
import UserMenu from './auth/UserMenu'
import { useLang } from '../context/LanguageContext'

const TIMER_STATIC = [
  { id: 'hiit',           i18nKey: 'hiit',           duration: '12 min', sessions: 892,  icon: 'local_fire_department', component: 'HiitTimer',          accentColor: '#00cc88' },
  { id: 'tabata',         i18nKey: 'tabata',         duration: '4 min',  sessions: 634,  icon: 'bolt',                  component: 'TabataTimer',        accentColor: '#ff6b35' },
  { id: 'pomodoro',       i18nKey: 'pomodoro',       duration: '25 min', sessions: 1247, icon: 'timer',                 component: 'PomodoroTimer',      accentColor: '#ff6b6b' },
  { id: 'box-breathing',  i18nKey: 'boxBreathing',   duration: '5 min',  sessions: 1156, icon: 'self_improvement',      component: 'BoxBreathingTimer',  accentColor: '#4ecdc4' },
  { id: 'relaxing-breath',i18nKey: 'relaxingBreath', duration: '3 min',  sessions: 923,  icon: 'nights_stay',           component: 'RelaxingBreathTimer',accentColor: '#9b59b6' },
  { id: 'calming-breath', i18nKey: 'calmingBreath',  duration: '4 min',  sessions: 756,  icon: 'spa',                   component: 'CalmingBreathTimer', accentColor: '#3498db' },
]

function TimersHome({ onTimerSelect, activeTimer, session, onAuthClick, onSignOut }) {
  const { t, lang, setLang } = useLang()

  const timers = TIMER_STATIC.map(s => ({
    ...s,
    name:        t(`${s.i18nKey}.name`),
    title:       t(`${s.i18nKey}.title`),
    description: t(`${s.i18nKey}.description`),
    category:    t(`${s.i18nKey}.category`),
  }))

  return (
    <div className="timers-home">
      <header className="home-header">
        <div className="header-content">
          <span className="header-label">WORKOUT TIMERS</span>
          <h1 className="header-title">Choose Your Timer</h1>
        </div>
        <div className="header-auth">
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          >
            {t('language.toggle')}
          </button>
          {session ? (
            <UserMenu session={session} onSignOut={onSignOut} />
          ) : (
            <button className="header-auth__login-btn" onClick={onAuthClick}>
              <span className="material-symbols-outlined">account_circle</span>
              {t('auth.signIn')}
            </button>
          )}
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

              <div className="timer-card__footer">
                <div className="timer-card__stats">
                  <span className="material-symbols-outlined">bar_chart</span>
                  {timer.sessions.toLocaleString()} sessions
                </div>
                <div className="timer-card__start">
                  <span className="material-symbols-outlined">play_circle</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TimersHome

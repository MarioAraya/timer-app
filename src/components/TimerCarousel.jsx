import './TimerCarousel.scss'

// Timer data configuration with Material icons
const timerData = [
  {
    id: "hiit",
    name: "HIIT",
    title: "HIIT Workout",
    description: "High-intensity interval training with customizable work and rest periods for maximum fitness gains.",
    category: "Fitness",
    duration: "12 min",
    sessions: 892,
    icon: "local_fire_department",
    component: "HiitTimer",
    accentColor: "#00cc88"
  },
  {
    id: "tabata",
    name: "Tabata",
    title: "Tabata Protocol",
    description: "20 seconds of intense work followed by 10 seconds of rest. The ultimate fat-burning workout.",
    category: "Fitness",
    duration: "4 min",
    sessions: 634,
    icon: "bolt",
    component: "TabataTimer",
    accentColor: "#ff6b35"
  },
  {
    id: "pomodoro",
    name: "Pomodoro",
    title: "Pomodoro Timer",
    description: "Focus for 25 minutes, then take a 5-minute break. Perfect for productivity and deep work sessions.",
    category: "Productivity",
    duration: "25 min",
    sessions: 1247,
    icon: "timer",
    component: "PomodoroTimer",
    accentColor: "#ff6b6b"
  },
  {
    id: "box-breathing",
    name: "Box Breathing",
    title: "Box Breathing",
    description: "Inhale for 4, hold for 4, exhale for 4, hold for 4. Used by Navy SEALs for stress management.",
    category: "Wellness",
    duration: "5 min",
    sessions: 1156,
    icon: "self_improvement",
    component: "BoxBreathingTimer",
    accentColor: "#4ecdc4"
  },
  {
    id: "relaxing-breath",
    name: "Relaxing Breath",
    title: "Relaxing Breath",
    description: "Inhale for 4, hold for 7, exhale for 8. Perfect for reducing anxiety and promoting sleep.",
    category: "Wellness",
    duration: "3 min",
    sessions: 923,
    icon: "nights_stay",
    component: "RelaxingBreathTimer",
    accentColor: "#9b59b6"
  },
  {
    id: "calming-breath",
    name: "Calming Breath",
    title: "Calming Breath",
    description: "Inhale for 4, hold for 2, exhale for 6. Gentle breathing technique for daily stress relief.",
    category: "Wellness",
    duration: "4 min",
    sessions: 756,
    icon: "spa",
    component: "CalmingBreathTimer",
    accentColor: "#3498db"
  }
]

function TimerCarousel({ onTimerSelect, activeTimer }) {
  const handleCardClick = (timer) => {
    onTimerSelect(timer)
  }

  return (
    <div className="timer-carousel">
      <header className="carousel-header">
        <div className="header-content">
          <span className="header-label">WORKOUT TIMERS</span>
          <h1 className="header-title">Choose Your Timer</h1>
        </div>
      </header>

      <div className="timer-carousel__grid">
        {timerData.map((timer) => {
          const isRunning = activeTimer && activeTimer.component === timer.component

          return (
            <div
              key={timer.id}
              className={`timer-card ${isRunning ? 'timer-card--running' : ''}`}
              onClick={() => handleCardClick(timer)}
              style={{ '--accent-color': timer.accentColor }}
            >
              {isRunning && (
                <div className="timer-card__now-playing">
                  <span className="material-symbols-outlined">play_arrow</span>
                  Now Playing
                </div>
              )}

              <div className="timer-card__icon-wrapper">
                <div className="icon-glow"></div>
                <span className="material-symbols-outlined timer-card__icon">{timer.icon}</span>
              </div>

              <div className="timer-card__content">
                <div className="timer-card__badges">
                  <div className="timer-card__category">
                    {timer.category}
                  </div>
                  <div className="timer-card__duration">
                    <span className="material-symbols-outlined">schedule</span>
                    {timer.duration}
                  </div>
                </div>

                <h3 className="timer-card__title">{timer.title}</h3>

                <p className="timer-card__description">
                  {timer.description}
                </p>
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

export default TimerCarousel

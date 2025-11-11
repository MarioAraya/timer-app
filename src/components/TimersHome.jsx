import './TimersHome.scss'

// Timer data configuration
const timerData = [
  {
    id: "pomodoro",
    name: "Pomodoro",
    title: "Pomodoro Timer",
    description: "Focus for 25 minutes, then take a 5-minute break. Perfect for productivity and deep work sessions.",
    category: "Productivity",
    duration: "25 min",
    sessions: 1247,
    icon: "🍅",
    component: "PomodoroTimer"
  },
  {
    id: "hiit",
    name: "HIIT",
    title: "HIIT Workout",
    description: "High-intensity interval training with customizable work and rest periods for maximum fitness gains.",
    category: "Fitness",
    duration: "12 min",
    sessions: 892,
    icon: "💪",
    component: "HiitTimer"
  },
  {
    id: "tabata",
    name: "Tabata",
    title: "Tabata Protocol",
    description: "20 seconds of intense work followed by 10 seconds of rest. The ultimate fat-burning workout.",
    category: "Fitness",
    duration: "4 min",
    sessions: 634,
    icon: "⚡",
    component: "TabataTimer"
  },
  {
    id: "box-breathing",
    name: "Box Breathing",
    title: "Box Breathing",
    description: "Inhale for 4, hold for 4, exhale for 4, hold for 4. Used by Navy SEALs for stress management.",
    category: "Wellness",
    duration: "5 min",
    sessions: 1156,
    icon: "🫁",
    component: "BoxBreathingTimer"
  },
  {
    id: "relaxing-breath",
    name: "Relaxing Breath",
    title: "Relaxing Breath",
    description: "Inhale for 4, hold for 7, exhale for 8. Perfect for reducing anxiety and promoting sleep.",
    category: "Wellness",
    duration: "3 min",
    sessions: 923,
    icon: "😌",
    component: "RelaxingBreathTimer"
  },
  {
    id: "calming-breath",
    name: "Calming Breath",
    title: "Calming Breath",
    description: "Inhale for 4, hold for 2, exhale for 6. Gentle breathing technique for daily stress relief.",
    category: "Wellness",
    duration: "4 min",
    sessions: 756,
    icon: "🧘",
    component: "CalmingBreathTimer"
  }
]

function TimersHome({ onTimerSelect, activeTimer }) {
  const handleCardClick = (timer) => {
    // Launch the timer directly
    onTimerSelect(timer)
  }

  return (
    <div className="timers-home">
      <div className="timers-home__grid">
        {timerData.map((timer) => {
          const isRunning = activeTimer && activeTimer.component === timer.component

          return (
            <div
              key={timer.id}
              className={`timer-card ${isRunning ? 'timer-card--running' : ''}`}
              onClick={() => handleCardClick(timer)}
            >
              {isRunning && (
                <div className="timer-card__now-playing">
                  <span className="timer-card__playing-icon">▶</span>
                  Now Playing
                </div>
              )}

              <div className="timer-card__header">
                <div className="timer-card__category">
                  {timer.category}
                </div>
                <div className="timer-card__duration">
                  <span className="timer-card__clock">⏱️</span>
                  {timer.duration}
                </div>
              </div>

              <div className="timer-card__content">
                <div className="timer-card__title">
                  <span className="timer-card__icon">{timer.icon}</span>
                  {timer.title}
                </div>

                <div className="timer-card__description">
                  {timer.description}
                </div>
              </div>

              <div className="timer-card__footer">
                <div className="timer-card__stats">
                  <span className="timer-card__sessions">
                    {timer.sessions} sessions
                  </span>
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

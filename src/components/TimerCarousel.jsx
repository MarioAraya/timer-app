import { useState, useRef, useEffect } from 'preact/hooks'
import './TimerCarousel.scss'

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
    component: "Timer"
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
    id: "breathing-444",
    name: "4-4-4-4",
    title: "Box Breathing",
    description: "Inhale for 4, hold for 4, exhale for 4, hold for 4. Used by Navy SEALs for stress management.",
    category: "Wellness",
    duration: "5 min",
    sessions: 1156,
    icon: "🫁",
    component: "Breathing44Timer"
  },
  {
    id: "breathing-478",
    name: "4-7-8",
    title: "Relaxing Breath",
    description: "Inhale for 4, hold for 7, exhale for 8. Perfect for reducing anxiety and promoting sleep.",
    category: "Wellness",
    duration: "3 min",
    sessions: 923,
    icon: "😌",
    component: "Breathing478Timer"
  },
  {
    id: "breathing-426",
    name: "4-2-6",
    title: "Calming Breath",
    description: "Inhale for 4, hold for 2, exhale for 6. Gentle breathing technique for daily stress relief.",
    category: "Wellness",
    duration: "4 min",
    sessions: 756,
    icon: "🧘",
    component: "Breathing426Timer"
  }
]

function TimerCarousel({ onTimerSelect, activeTimer }) {
  const [activeTimerId, setActiveTimerId] = useState(timerData[0].id)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isInteracting, setIsInteracting] = useState(false)
  const [lastScrollTime, setLastScrollTime] = useState(0)
  const [scrollAccumulator, setScrollAccumulator] = useState(0)
  const containerRef = useRef()

  // Set active card to the running timer if there is one
  useEffect(() => {
    if (activeTimer && activeTimer.component) {
      const timer = timerData.find(t => t.component === activeTimer.component)
      if (timer) {
        setActiveTimerId(timer.id)
      }
    }
  }, [activeTimer])

  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault()

      const now = Date.now()
      const timeDiff = now - lastScrollTime

      if (timeDiff < 200) return

      const newAccumulator = scrollAccumulator + Math.abs(e.deltaY)

      if (newAccumulator < 100) {
        setScrollAccumulator(newAccumulator)
        return
      }

      setScrollAccumulator(0)
      setLastScrollTime(now)

      const currentIndex = timerData.findIndex((timer) => timer.id === activeTimerId)
      let nextIndex

      if (e.deltaY > 0) {
        nextIndex = (currentIndex + 1) % timerData.length
      } else {
        nextIndex = currentIndex === 0 ? timerData.length - 1 : currentIndex - 1
      }

      setActiveTimerId(timerData[nextIndex].id)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false })
      return () => container.removeEventListener("wheel", handleWheel)
    }
  }, [activeTimerId, lastScrollTime, scrollAccumulator])

  const handleCardClick = (timerId) => {
    const clickedTimer = timerData.find(t => t.id === timerId)

    if (timerId === activeTimerId) {
      // If clicking the active card, start the timer
      onTimerSelect(clickedTimer)
    } else {
      // Otherwise, make it active
      setActiveTimerId(timerId)
    }
  }

  const handleMouseMove = (e) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const rotateX = (e.clientY - centerY) / 10
    const rotateY = (centerX - e.clientX) / 10

    setRotation({ 
      x: Math.max(-15, Math.min(15, rotateX)), 
      y: Math.max(-15, Math.min(15, rotateY)) 
    })
  }

  const handleMouseEnter = () => {
    setIsInteracting(true)
  }

  const handleMouseLeave = () => {
    setIsInteracting(false)
    setRotation({ x: 0, y: 0 })
  }

  const handleTouchStart = (e) => {
    setIsInteracting(true)
  }

  const handleTouchMove = (e) => {
    if (!containerRef.current || e.touches.length === 0) return

    const touch = e.touches[0]
    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const rotateX = (touch.clientY - centerY) / 10
    const rotateY = (centerX - touch.clientX) / 10

    setRotation({ 
      x: Math.max(-15, Math.min(15, rotateX)), 
      y: Math.max(-15, Math.min(15, rotateY)) 
    })
  }

  const handleTouchEnd = () => {
    setIsInteracting(false)
    setRotation({ x: 0, y: 0 })
  }

  const getAnimationClass = (index, isActive, adjustedIndex) => {
    const baseClass = "timer-card"

    if (isActive) {
      return `${baseClass} timer-card--active`
    }

    const stackIndex = Math.min(adjustedIndex, 4)
    return `${baseClass} timer-card--stacked timer-card--index-${stackIndex}`
  }

  return (
    <div className="timer-carousel">
      <div
        ref={containerRef}
        className="timer-carousel__container"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {timerData.map((timer, index) => {
          const isActive = timer.id === activeTimerId
          const activeIndex = timerData.findIndex((t) => t.id === activeTimerId)
          
          // Calculate position relative to active card
          let adjustedIndex = index - activeIndex
          if (adjustedIndex < 0) {
            adjustedIndex = timerData.length + adjustedIndex
          }

          const isRunning = activeTimer && activeTimer.component === timer.component

          return (
            <div
              key={timer.id}
              className={`${getAnimationClass(index, isActive, adjustedIndex)} ${isRunning ? 'timer-card--running' : ''}`}
              onClick={() => handleCardClick(timer.id)}
              style={
                isActive
                  ? {
                      transform: `translateY(0) scale(1) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                      transition: isInteracting ? "transform 0.1s ease-out" : "transform 0.4s ease-out",
                    }
                  : {}
              }
            >
              {isRunning && (
                <div className="timer-card__now-playing">
                  <span className="timer-card__playing-icon">▶</span>
                  Now Playing...
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
                
                {isActive && (
                  <div className="timer-card__description">
                    {timer.description}
                  </div>
                )}
              </div>

              {isActive && (
                <div className="timer-card__footer">
                  <div className="timer-card__stats">
                    <span className="timer-card__sessions">
                      {timer.sessions} sessions
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="timer-carousel__indicators">
        {timerData.map((timer) => (
          <button
            key={timer.id}
            onClick={() => handleCardClick(timer.id)}
            className={`timer-carousel__dot ${
              timer.id === activeTimerId ? 'timer-carousel__dot--active' : ''
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default TimerCarousel
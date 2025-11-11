import { useState, useEffect } from 'preact/hooks'
import './App.css'
import TimersHome from './components/TimersHome'
import PomodoroTimer from './components/PomodoroTimer'
import HiitTimer from './components/HiitTimer'
import TabataTimer from './components/TabataTimer'
import BoxBreathingTimer from './components/BoxBreathingTimer'
import RelaxingBreathTimer from './components/RelaxingBreathTimer'
import CalmingBreathTimer from './components/CalmingBreathTimer'
import { saveActiveTimer, loadActiveTimer, clearActiveTimer, saveFavoriteTimer, loadFavoriteTimer } from './utils/localStorage'

function App() {
  // Try to restore active timer on mount
  const savedActiveTimer = loadActiveTimer()

  const [currentView, setCurrentView] = useState(savedActiveTimer ? 'timer' : 'carousel')
  const [activeTimer, setActiveTimer] = useState(savedActiveTimer)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [favoriteTimer, setFavoriteTimer] = useState(loadFavoriteTimer())
  const [showBackButton, setShowBackButton] = useState(true)
  const [hideButtonTimeout, setHideButtonTimeout] = useState(null)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          // console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.error('SW registration failed: ', registrationError);
        });
    }

    // Network status detection
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Browser back button support
    const handlePopState = (event) => {
      if (currentView === 'timer') {
        handleBackToCarousel()
      }
    }

    window.addEventListener('popstate', handlePopState)

    // Mouse movement detection for auto-hiding back button
    const handleMouseMove = () => {
      // Show back button on movement
      setShowBackButton(true)

      // Clear existing timeout
      if (hideButtonTimeout) {
        clearTimeout(hideButtonTimeout)
      }

      // Set new timeout to hide after 3 seconds
      const timeout = setTimeout(() => {
        setShowBackButton(false)
      }, 3000)

      setHideButtonTimeout(timeout)
    }

    if (currentView === 'timer') {
      window.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('mousemove', handleMouseMove)
      if (hideButtonTimeout) {
        clearTimeout(hideButtonTimeout)
      }
    }
  }, [currentView, hideButtonTimeout])

  const handleTimerSelect = (timerData) => {
    setActiveTimer(timerData)
    setCurrentView('timer')
    // Save active timer to localStorage
    saveActiveTimer(timerData)
    // console.log('💾 Saved active timer:', timerData.title)
    // Add to browser history for back button support
    window.history.pushState({ view: 'timer' }, '')
  }

  const handleBackToCarousel = () => {
    // DON'T clear active timer - keep it to show "Now Playing" indicator
    // The timer's own cleanup will save its state
    setCurrentView('carousel')
    // console.log('🔙 Going back to carousel, keeping active timer reference')
  }

  const handleSetFavorite = (timerData) => {
    setFavoriteTimer(timerData)
    saveFavoriteTimer(timerData)
    // console.log('⭐ Saved favorite timer:', timerData.title)
  }

  // Touch gesture handlers for swipe back
  const handleTouchStart = (e) => {
    if (currentView === 'timer') {
      setTouchEnd(null)
      setTouchStart(e.targetTouches[0].clientX)
    }
  }

  const handleTouchMove = (e) => {
    if (currentView === 'timer') {
      setTouchEnd(e.targetTouches[0].clientX)
    }
  }

  const handleTouchEnd = () => {
    if (currentView === 'timer' && touchStart && touchEnd) {
      const distance = touchStart - touchEnd
      const isLeftSwipe = distance > 50
      const isRightSwipe = distance < -50

      // Right swipe (two-finger swipe gesture mimicked)
      if (isRightSwipe) {
        handleBackToCarousel()
      }
    }
  }

  const renderActiveTimer = () => {
    if (!activeTimer) return null

    const commonProps = {
      name: activeTimer.title,
      autoMaximize: true,
      autoStart: false, // Never auto-start - let user control when to start/resume
      showBackButton: showBackButton,
      onBackClick: handleBackToCarousel
    }

    switch (activeTimer.component) {
      case 'PomodoroTimer':
        return <PomodoroTimer {...commonProps} />
      case 'HiitTimer':
        return <HiitTimer {...commonProps} />
      case 'TabataTimer':
        return <TabataTimer {...commonProps} />
      case 'BoxBreathingTimer':
        return <BoxBreathingTimer {...commonProps} />
      case 'RelaxingBreathTimer':
        return <RelaxingBreathTimer {...commonProps} />
      case 'CalmingBreathTimer':
        return <CalmingBreathTimer {...commonProps} />
      default:
        return null
    }
  }

  return (
    <div
      className="app"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <header className="app-header">
        {/* Show offline indicator when needed */}
        {!isOnline && (
          <span className="offline-indicator" title="Sin conexión">📵</span>
        )}
      </header>

      <main className="app-content">
        {currentView === 'carousel' ? (
          <TimersHome
            onTimerSelect={handleTimerSelect}
            onSetFavorite={handleSetFavorite}
            favoriteTimer={favoriteTimer}
            activeTimer={activeTimer}
          />
        ) : (
          <div className="timer-view">
            {renderActiveTimer()}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
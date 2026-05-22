import { useState, useEffect, useRef } from 'preact/hooks'
import './App.css'
import TimersHome from './components/TimersHome'
import PomodoroTimer from './components/PomodoroTimer'
import HiitTimer from './components/hiit/HiitTimerNew'
import TabataTimer from './components/tabata/TabataTimerNew'
import BoxBreathingTimer from './components/breath/BoxBreathingTimer'
import RelaxingBreathTimer from './components/breath/RelaxingBreathTimer'
import CalmingBreathTimer from './components/breath/CalmingBreathTimer'
import WimHofTimer from './components/breath/WimHofTimer'
import { saveActiveTimer, loadActiveTimer, clearActiveTimer, saveFavoriteTimer, loadFavoriteTimer } from './utils/localStorage'
import { useAuth } from './hooks/useAuth'
import AuthModal from './components/auth/AuthModal'
import { useLang } from './context/LanguageContext'

function App() {
  const { session, loading: authLoading, signInWithGoogle, signInWithMagicLink, signOut } = useAuth()
  const { t } = useLang()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const timerIsRunningRef = useRef(false)

  // Try to restore active timer on mount
  const savedActiveTimer = loadActiveTimer()

  const [currentView, setCurrentView] = useState(savedActiveTimer ? 'timer' : 'carousel')
  const [activeTimer, setActiveTimer] = useState(savedActiveTimer)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [favoriteTimer, setFavoriteTimer] = useState(loadFavoriteTimer())

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister())
      })
    }
  }, [])

  useEffect(() => {
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

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [currentView])

  const handleTimerSelect = (timerData) => {
    setActiveTimer(timerData)
    setCurrentView('timer')
    // Save active timer to localStorage
    saveActiveTimer(timerData)
    // console.log('💾 Saved active timer:', timerData.title)
    // Add to browser history for back button support
    window.history.pushState({ view: 'timer' }, '')
  }

  const doBackToCarousel = () => {
    timerIsRunningRef.current = false
    setActiveTimer(null)
    clearActiveTimer()
    setCurrentView('carousel')
  }

  const handleBackToCarousel = () => {
    if (timerIsRunningRef.current) {
      setShowExitConfirm(true)
      return
    }
    doBackToCarousel()
  }

  const handleRunningChange = (running) => {
    timerIsRunningRef.current = running
  }

  const handleTimerFinish = () => {
    setActiveTimer(null)
    clearActiveTimer()
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
      const isRightSwipe = distance < -80

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
      showBackButton: true,
      onBackClick: handleBackToCarousel,
      onFinish: handleTimerFinish
    }

    switch (activeTimer.component) {
      case 'PomodoroTimer':
        return <PomodoroTimer {...commonProps} />
      case 'HiitTimer':
        return <HiitTimer {...commonProps} onRunningChange={handleRunningChange} />
      case 'TabataTimer':
        return <TabataTimer {...commonProps} onRunningChange={handleRunningChange} />
      case 'BoxBreathingTimer':
        return <BoxBreathingTimer {...commonProps} />
      case 'RelaxingBreathTimer':
        return <RelaxingBreathTimer {...commonProps} />
      case 'CalmingBreathTimer':
        return <CalmingBreathTimer {...commonProps} />
      case 'WimHofTimer':
        return <WimHofTimer {...commonProps} />
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
            session={session}
            onAuthClick={() => setShowAuthModal(true)}
            onSignOut={signOut}
          />
        ) : (
          <div className="timer-view">
            {renderActiveTimer()}
          </div>
        )}
      </main>

      {showExitConfirm && (
        <div className="exit-confirm-overlay" onClick={() => setShowExitConfirm(false)}>
          <div className="exit-confirm-dialog" onClick={e => e.stopPropagation()}>
            <p>{t('active.exitConfirm.message')}</p>
            <div className="exit-confirm-actions">
              <button className="exit-confirm-cancel" onClick={() => setShowExitConfirm(false)}>
                {t('active.exitConfirm.cancel')}
              </button>
              <button className="exit-confirm-leave" onClick={() => { setShowExitConfirm(false); doBackToCarousel() }}>
                {t('active.exitConfirm.leave')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && !session && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          signInWithGoogle={signInWithGoogle}
          signInWithMagicLink={signInWithMagicLink}
        />
      )}
    </div>
  )
}

export default App
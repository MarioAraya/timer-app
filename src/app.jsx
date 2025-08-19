import { useState, useEffect } from 'preact/hooks'
import './App.css'
import Timer from './components/Timer'
import HiitTimer from './components/HiitTimer'
import TabataTimer from './components/TabataTimer'
import Breathing44Timer from './components/Breathing44Timer'

function App() {
  const [timers, setTimers] = useState([
    { id: 1, name: 'Pomodoro', duration: 1500, message: 'Time to focus!' }
  ])
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Network status detection
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const addTimer = () => {
    const newTimer = {
      id: Date.now(),
      name: 'New Timer',
      duration: 300, // 5 minutes
      message: 'Timer finished!'
    }
    setTimers([...timers, newTimer])
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          Timer App 
          {!isOnline && <span className="offline-indicator" title="Sin conexión">📵</span>}
        </h1>
        <button onClick={addTimer} className="add-btn">
          + Add Timer
        </button>
      </header>
      
      <main className="timers-container">
        {timers.map(timer => (
          <Timer 
            key={timer.id}
            initialTime={timer.duration}
            message={timer.message}
            name={timer.name}
          />
        ))}
        <HiitTimer name="Morning HIIT" />
        <TabataTimer name="Evening Tabata" />
        <Breathing44Timer name="Breathing 4-4" />
      </main>
    </div>
  )
}

export default App
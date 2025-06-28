import { useState } from 'preact/hooks'
import Timer from './components/Timer'
import './App.css'

function App() {
  const [timers, setTimers] = useState([
    { id: 1, name: 'Pomodoro', duration: 1500, message: 'Time to focus!' }
  ])

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
        <h1>Timer App</h1>
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
      </main>
    </div>
  )
}

export default App
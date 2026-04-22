import { useState, useEffect } from 'preact/hooks'
import './Confetti.scss'

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff']

const createParticles = (count = 100) => {
  const particles = []
  for (let i = 0; i < count; i++) {
    particles.push({
      id: Math.random(),
      x: Math.random() * window.innerWidth,
      y: -10,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * 5 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      gravity: 0.2,
      life: 1
    })
  }
  return particles
}

function Confetti({ isActive, onComplete }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (isActive) {
      setParticles(createParticles())

      const intervalId = setInterval(() => {
        setParticles(prevParticles => {
          const updated = prevParticles.map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + p.gravity,
            rotation: p.rotation + p.rotationSpeed,
            life: p.life - 0.008
          })).filter(p => p.y < window.innerHeight + 50 && p.life > 0)

          // Loop: spawn new batch when current one is exhausted
          return updated.length === 0 ? createParticles() : updated
        })
      }, 16)

      return () => clearInterval(intervalId)
    } else {
      setParticles([])
      if (onComplete) onComplete()
    }
  }, [isActive])

  if (!isActive || particles.length === 0) return null

  return (
    <div className="confetti-container">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="confetti-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            backgroundColor: particle.color,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            transform: `rotate(${particle.rotation}deg)`,
            opacity: particle.life
          }}
        />
      ))}
    </div>
  )
}

export default Confetti
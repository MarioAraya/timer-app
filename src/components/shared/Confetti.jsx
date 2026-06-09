import { useState, useEffect } from 'preact/hooks'
import './Confetti.scss'

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff']

const createParticles = (count = 140, origin) => {
  const ox = origin?.x ?? window.innerWidth / 2
  const oy = origin?.y ?? window.innerHeight / 2
  const particles = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 14 + 5
    particles.push({
      id: Math.random(),
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6, // upward bias so burst opens upward
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 14,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 10 + 5,
      gravity: 0.3,
      life: 1
    })
  }
  return particles
}

function Confetti({ isActive, onComplete, origin }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (isActive) {
      setParticles(createParticles(140, origin))

      const intervalId = setInterval(() => {
        setParticles(prevParticles => {
          const updated = prevParticles.map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + p.gravity,
            rotation: p.rotation + p.rotationSpeed,
            life: p.life - 0.007
          })).filter(p => p.y < window.innerHeight + 50 && p.life > 0)

          return updated.length === 0 ? createParticles(140, origin) : updated
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

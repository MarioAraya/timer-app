import { useState, useEffect } from 'preact/hooks'
import './Confetti.scss'

function Confetti({ isActive, onComplete }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (isActive) {
      // Create confetti particles
      const newParticles = []
      for (let i = 0; i < 100; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: -10,
          vx: (Math.random() - 0.5) * 10,
          vy: Math.random() * 5 + 2,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'][Math.floor(Math.random() * 7)],
          size: Math.random() * 8 + 4,
          gravity: 0.2,
          life: 1
        })
      }
      setParticles(newParticles)

      // Animation loop
      const animate = () => {
        setParticles(prevParticles => {
          const updatedParticles = prevParticles.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + particle.gravity,
            rotation: particle.rotation + particle.rotationSpeed,
            life: particle.life - 0.008
          })).filter(particle => particle.y < window.innerHeight + 50 && particle.life > 0)

          if (updatedParticles.length === 0 && onComplete) {
            onComplete()
          }

          return updatedParticles
        })
      }

      const intervalId = setInterval(animate, 16) // ~60fps

      // Cleanup after 5 seconds
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId)
        setParticles([])
        if (onComplete) onComplete()
      }, 5000)

      return () => {
        clearInterval(intervalId)
        clearTimeout(timeoutId)
      }
    } else {
      setParticles([])
    }
  }, [isActive, onComplete])

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
import React, { useState, useEffect, useRef } from 'react';

const RoundTimer = () => {
  const [currentRound, setCurrentRound] = useState(0);
  const [phase, setPhase] = useState('preparation'); // 'preparation', 'round', 'rest'
  const [innerProgress, setInnerProgress] = useState(1); // Empieza lleno
  const [outerProgress, setOuterProgress] = useState(1); // Empieza lleno
  const animationFrameRef = useRef();
  const startTimeRef = useRef(null);
  const phaseStartTimeRef = useRef(null);
  const completedRoundsRef = useRef(0);

  useEffect(() => {
    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        phaseStartTimeRef.current = timestamp;
      }

      const phaseElapsed = timestamp - phaseStartTimeRef.current;
      
      if (phase === 'preparation') {
        // Fase de preparación: 10 segundos
        const prepProgress = Math.max(0, 1 - (phaseElapsed / 10000));
        setInnerProgress(prepProgress);
        
        if (phaseElapsed >= 10000) {
          setPhase('round');
          setCurrentRound(1);
          phaseStartTimeRef.current = timestamp;
          setInnerProgress(1); // Reset a lleno para el round
        }
      } else if (phase === 'round') {
        // Fase de round: 20 segundos
        const roundProgress = Math.max(0, 1 - (phaseElapsed / 20000));
        setInnerProgress(roundProgress);
        
        if (phaseElapsed >= 20000) {
          completedRoundsRef.current += 1;
          setPhase('rest');
          phaseStartTimeRef.current = timestamp;
          setInnerProgress(1); // Reset a lleno para el descanso
        }
        
        // Progreso exterior: se vacía durante 8 rounds (8 rounds × 20s + 7 descansos × 10s = 230s total)
        // Calculamos el tiempo total desde el inicio de los rounds
        const totalRoundTime = timestamp - startTimeRef.current - 10000; // Restamos la preparación inicial
        const cycleTime = 230000; // 8 rounds de 20s + 7 descansos de 10s
        const outerProgressValue = Math.max(0, 1 - (totalRoundTime % cycleTime) / cycleTime);
        setOuterProgress(outerProgressValue);
        
      } else if (phase === 'rest') {
        // Fase de descanso: 10 segundos
        const restProgress = Math.max(0, 1 - (phaseElapsed / 10000));
        setInnerProgress(restProgress);
        
        if (phaseElapsed >= 10000) {
          setPhase('round');
          setCurrentRound(currentRound + 1);
          phaseStartTimeRef.current = timestamp;
          setInnerProgress(1); // Reset a lleno para el siguiente round
        }
        
        // Mantener el progreso del círculo exterior durante el descanso
        const totalRoundTime = timestamp - startTimeRef.current - 10000;
        const cycleTime = 230000;
        const outerProgressValue = Math.max(0, 1 - (totalRoundTime % cycleTime) / cycleTime);
        setOuterProgress(outerProgressValue);
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase, currentRound]);

  const size = 300;
  const strokeWidth = 20;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Radio para el círculo exterior (más grande)
  const outerRadius = radius + 15;
  const outerCircumference = 2 * Math.PI * outerRadius;

  // Calcular segundos restantes para mostrar
  const getTimeDisplay = () => {
    if (phase === 'preparation') return '10s';
    if (phase === 'round') return `${Math.ceil(innerProgress * 20)}s`;
    if (phase === 'rest') return `${Math.ceil(innerProgress * 10)}s`;
    return '0s';
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#90EE90' }}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* SVG para los círculos animados */}
        <svg
          width={size}
          height={size}
          className="absolute top-0 left-0 transform -rotate-90"
        >
          {/* Círculo exterior - fondo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={outerRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={strokeWidth}
          />
          
          {/* Círculo exterior - progreso (blanco) */}
          {phase !== 'preparation' && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={outerRadius}
              fill="none"
              stroke="white"
              strokeWidth={strokeWidth}
              strokeDasharray={outerCircumference}
              strokeDashoffset={outerCircumference * (1 - outerProgress)}
              strokeLinecap="round"
              style={{
                transition: 'none',
              }}
            />
          )}
          
          {/* Círculo interior - fondo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={strokeWidth}
          />
          
          {/* Círculo interior - progreso (verde o naranja) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={phase === 'round' ? '#00C851' : '#FFA500'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - innerProgress)}
            strokeLinecap="round"
            style={{
              transition: 'none',
              filter: phase === 'round' 
                ? 'drop-shadow(0 0 10px rgba(0, 200, 81, 0.5))' 
                : 'drop-shadow(0 0 10px rgba(255, 165, 0, 0.5))'
            }}
          />
        </svg>
        
        {/* Contenido central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            {phase === 'preparation' ? (
              <>
                <div className="text-white text-2xl font-bold mb-2">PREPARACIÓN</div>
                <div className="text-white text-5xl font-bold">{getTimeDisplay()}</div>
              </>
            ) : phase === 'round' ? (
              <>
                <div className="text-white text-2xl font-bold mb-2">ROUND</div>
                <div className="text-white text-6xl font-bold">
                  {String(currentRound).padStart(2, '0')}
                </div>
                <div className="text-white text-xl mt-2">{getTimeDisplay()}</div>
              </>
            ) : (
              <>
                <div className="text-white text-2xl font-bold mb-2">DESCANSO</div>
                <div className="text-white text-5xl font-bold">{getTimeDisplay()}</div>
                <div className="text-white text-lg mt-2">Próximo: Round {String(currentRound + 1).padStart(2, '0')}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundTimer;
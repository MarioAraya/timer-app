import './CalmingBreathTimer.scss'
import BreathingTimer from './BreathingTimer'

const CALMING_BREATHING_CONFIG = {
  phases: [
    { name: 'Inhale', duration: 4, instruction: 'Breathe In',  color: 'inhale', type: 'inhale' },
    { name: 'Hold',   duration: 2, instruction: 'Hold',        color: 'hold',   type: 'hold'   },
    { name: 'Exhale', duration: 6, instruction: 'Breathe Out', color: 'exhale', type: 'exhale' }
  ]
}

function CalmingBreathTimer(props) {
  return (
    <BreathingTimer
      {...props}
      name={props.name || '4-2-6 Breathing'}
      phases={CALMING_BREATHING_CONFIG.phases}
      patternName="4-2-6 (Calming Breath)"
      className="calming-breath-timer"
    />
  )
}

export default CalmingBreathTimer

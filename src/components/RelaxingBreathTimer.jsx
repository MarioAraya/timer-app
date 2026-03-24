import './RelaxingBreathTimer.scss'
import BreathingTimer from './BreathingTimer'

const RELAXING_BREATHING_CONFIG = {
  phases: [
    { name: 'Inhale', duration: 4, instruction: 'Breathe In', color: 'inhale' },
    { name: 'Hold', duration: 7, instruction: 'Hold', color: 'hold' },
    { name: 'Exhale', duration: 8, instruction: 'Breathe Out', color: 'exhale' }
  ]
}

function RelaxingBreathTimer(props) {
  return (
    <BreathingTimer
      {...props}
      name={props.name || '4-7-8 Breathing'}
      phases={RELAXING_BREATHING_CONFIG.phases}
      patternName="4-7-8 (Relaxing Breath)"
      className="relaxing-breath-timer"
    />
  )
}

export default RelaxingBreathTimer

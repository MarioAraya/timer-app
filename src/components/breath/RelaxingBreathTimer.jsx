import './RelaxingBreathTimer.scss'
import BreathingTimer from './BreathingTimer'
import { incrementSessionCount } from '../../utils/localStorage'

const RELAXING_BREATHING_CONFIG = {
  phases: [
    { name: 'Inhale', duration: 4, instruction: 'Breathe In',  color: 'inhale', type: 'inhale' },
    { name: 'Hold',   duration: 7, instruction: 'Hold',        color: 'hold',   type: 'hold'   },
    { name: 'Exhale', duration: 8, instruction: 'Breathe Out', color: 'exhale', type: 'exhale' }
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
      onCycleComplete={() => incrementSessionCount('relaxingBreath')}
    />
  )
}

export default RelaxingBreathTimer

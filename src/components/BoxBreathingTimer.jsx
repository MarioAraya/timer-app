import './BoxBreathingTimer.scss'
import BreathingTimer from './BreathingTimer'
import { incrementSessionCount } from '../utils/localStorage'

const BOX_BREATHING_CONFIG = {
  phases: [
    { name: 'Inhale', duration: 4, instruction: 'Breathe In', color: 'inhale', type: 'inhale' },
    { name: 'Hold',   duration: 4, instruction: 'Hold',       color: 'hold1', type: 'hold'   },
    { name: 'Exhale', duration: 4, instruction: 'Breathe Out', color: 'exhale', type: 'exhale' },
    { name: 'Hold',   duration: 4, instruction: 'Hold',       color: 'hold2', type: 'hold'   }
  ]
}

function BoxBreathingTimer(props) {
  return (
    <BreathingTimer
      {...props}
      name={props.name || '4-4-4-4 Breathing'}
      phases={BOX_BREATHING_CONFIG.phases}
      patternName="4-4-4-4 (Box Breathing)"
      className="box-breath-timer"
      onCycleComplete={() => incrementSessionCount('boxBreathing')}
    />
  )
}

export default BoxBreathingTimer

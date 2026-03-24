import './BoxBreathingTimer.scss'
import BreathingTimer from './BreathingTimer'

const BOX_BREATHING_CONFIG = {
  phases: [
    { name: 'Inhale', duration: 4, instruction: 'Breathe In', color: 'inhale' },
    { name: 'Hold', duration: 4, instruction: 'Hold', color: 'hold1' },
    { name: 'Exhale', duration: 4, instruction: 'Breathe Out', color: 'exhale' },
    { name: 'Hold', duration: 4, instruction: 'Hold', color: 'hold2' }
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
    />
  )
}

export default BoxBreathingTimer

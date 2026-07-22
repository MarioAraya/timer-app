import { useMemo } from 'preact/hooks'
import './BoxBreathingTimer.scss'
import BreathingTimer from './BreathingTimer'
import { useLang } from '../../context/LanguageContext'
import { translations } from '../../i18n'
import { incrementSessionCount } from '../../utils/localStorage'

function BoxBreathingTimer(props) {
  const { lang } = useLang()

  const phases = useMemo(() => {
    const p = translations[lang]?.boxBreathing?.phases ?? translations.en.boxBreathing.phases
    return [
      { name: p.inhale.name, duration: 4, instruction: p.inhale.instruction, color: 'inhale', type: 'inhale' },
      { name: p.hold.name,   duration: 4, instruction: p.hold.instruction,   color: 'hold1',  type: 'hold'   },
      { name: p.exhale.name, duration: 4, instruction: p.exhale.instruction, color: 'exhale', type: 'exhale' },
      { name: p.hold.name,   duration: 4, instruction: p.hold.instruction,   color: 'hold2',  type: 'hold'   },
    ]
  }, [lang])

  return (
    <BreathingTimer
      {...props}
      name={props.name || translations[lang]?.boxBreathing?.name || 'Box Breathing'}
      phases={phases}
      patternName="4-4-4-4 (Box Breathing)"
      className="box-breath-timer"
      onCycleComplete={() => incrementSessionCount('boxBreathing')}
    />
  )
}

export default BoxBreathingTimer

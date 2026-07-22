import { useMemo } from 'preact/hooks'
import './RelaxingBreathTimer.scss'
import BreathingTimer from './BreathingTimer'
import { useLang } from '../../context/LanguageContext'
import { translations } from '../../i18n'
import { incrementSessionCount } from '../../utils/localStorage'

function RelaxingBreathTimer(props) {
  const { lang } = useLang()

  const phases = useMemo(() => {
    const p = translations[lang]?.relaxingBreath?.phases ?? translations.en.relaxingBreath.phases
    return [
      { name: p.inhale.name, duration: 4, instruction: p.inhale.instruction, color: 'inhale', type: 'inhale' },
      { name: p.hold.name,   duration: 7, instruction: p.hold.instruction,   color: 'hold',   type: 'hold'   },
      { name: p.exhale.name, duration: 8, instruction: p.exhale.instruction, color: 'exhale', type: 'exhale' },
    ]
  }, [lang])

  return (
    <BreathingTimer
      {...props}
      name={props.name || translations[lang]?.relaxingBreath?.name || 'Relaxing Breath'}
      phases={phases}
      patternName="4-7-8 (Relaxing Breath)"
      className="relaxing-breath-timer"
      onCycleComplete={() => incrementSessionCount('relaxingBreath')}
    />
  )
}

export default RelaxingBreathTimer

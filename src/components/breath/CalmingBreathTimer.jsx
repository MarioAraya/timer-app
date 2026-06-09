import { useMemo } from 'preact/hooks'
import './CalmingBreathTimer.scss'
import BreathingTimer from './BreathingTimer'
import { useLang } from '../../context/LanguageContext'
import { translations } from '../../i18n'
import { incrementSessionCount } from '../../utils/localStorage'

function CalmingBreathTimer(props) {
  const { lang } = useLang()

  const phases = useMemo(() => {
    const p = translations[lang]?.calmingBreath?.phases ?? translations.en.calmingBreath.phases
    return [
      { name: 'Inhale', duration: 4, instruction: p.inhale.instruction, color: 'inhale', type: 'inhale', guidances: p.inhale.guidances },
      { name: 'Hold',   duration: 2, instruction: p.hold.instruction,   color: 'hold',   type: 'hold',   guidances: p.hold.guidances   },
      { name: 'Exhale', duration: 6, instruction: p.exhale.instruction, color: 'exhale', type: 'exhale', guidances: p.exhale.guidances  },
    ]
  }, [lang])

  return (
    <BreathingTimer
      {...props}
      name={props.name || translations[lang]?.calmingBreath?.name || 'Calming Breath'}
      phases={phases}
      patternName="4-2-6 (Calming Breath)"
      className="calming-breath-timer"
      onCycleComplete={() => incrementSessionCount('calmingBreath')}
    />
  )
}

export default CalmingBreathTimer

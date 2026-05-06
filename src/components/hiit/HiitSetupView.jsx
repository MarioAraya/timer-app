import WorkoutSetupView from '../shared/WorkoutSetupView'
import { useLang } from '../../context/LanguageContext'

function HiitSetupView({ config, onStart, onBackClick, totalTime }) {
  const { t } = useLang()

  const theme = {
    name: 'hiit',
    className: 'theme-hiit',
    title: t('hiit.setupTitle'),
    roundsLabel: t('setup.sets'),
    workLabel: t('hiit.workLabel'),
    defaultTotalTime: '12:00',
    quote: {
      phase: t('hiit.quotePhase'),
      time: '0:05',
      text: t('hiit.quoteText'),
    },
    work: { default: 40, min: 20, max: 60 },
    rest: { default: 20, min: 10, max: 30 },
  }

  return (
    <WorkoutSetupView
      config={config}
      theme={theme}
      onStart={onStart}
      onBackClick={onBackClick}
      totalTime={totalTime}
    />
  )
}

export default HiitSetupView

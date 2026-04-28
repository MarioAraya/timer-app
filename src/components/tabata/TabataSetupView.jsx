import WorkoutSetupView from '../shared/WorkoutSetupView'
import { useLang } from '../../context/LanguageContext'

function TabataSetupView({ config, onStart, onBackClick, totalTime }) {
  const { t } = useLang()

  const theme = {
    name: 'tabata',
    className: 'theme-tabata',
    title: t('tabata.setupTitle'),
    roundsLabel: t('setup.sets'),
    workLabel: t('tabata.workLabel'),
    defaultTotalTime: '4:00',
    quote: {
      phase: t('tabata.quotePhase'),
      time: '0:15',
      text: t('tabata.quoteText'),
    },
    work: { default: 20, min: 10, max: 30 },
    rest: { default: 10, min: 5, max: 20 },
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

export default TabataSetupView

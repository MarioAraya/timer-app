import WorkoutSetupView from '../shared/WorkoutSetupView'

const TABATA_THEME = {
  name: 'tabata',
  className: 'theme-tabata',
  title: 'Tabata Setup',
  roundsLabel: 'Rounds',
  workLabel: 'MAX EFFORT',
  startText: 'START TABATA',
  defaultTotalTime: '4:00',
  quote: {
    phase: 'WORK',
    time: '0:15',
    text: 'Maximum effort! Give it everything!'
  },
  work: { default: 20, min: 10, max: 30 },
  rest: { default: 10, min: 5, max: 20 }
}

function TabataSetupView({ config, onStart, onBackClick, totalTime }) {
  return (
    <WorkoutSetupView
      config={config}
      theme={TABATA_THEME}
      onStart={onStart}
      onBackClick={onBackClick}
      totalTime={totalTime}
    />
  )
}

export default TabataSetupView

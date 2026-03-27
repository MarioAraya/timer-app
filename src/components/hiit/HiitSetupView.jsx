import WorkoutSetupView from '../shared/WorkoutSetupView'

const HIIT_THEME = {
  name: 'hiit',
  className: 'theme-hiit',
  title: 'Workout Setup',
  roundsLabel: 'Sets',
  workLabel: 'HIGH INTENSITY',
  startText: 'START WORKOUT',
  defaultTotalTime: '12:00',
  quote: {
    phase: 'REST',
    time: '0:05',
    text: 'Deep breaths. Get ready for the next round.'
  },
  work: { default: 40, min: 20, max: 60 },
  rest: { default: 20, min: 10, max: 30 }
}

function HiitSetupView({ config, onStart, onBackClick, totalTime }) {
  return (
    <WorkoutSetupView
      config={config}
      theme={HIIT_THEME}
      onStart={onStart}
      onBackClick={onBackClick}
      totalTime={totalTime}
    />
  )
}

export default HiitSetupView

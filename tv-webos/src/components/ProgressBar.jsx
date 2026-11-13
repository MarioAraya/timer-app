export function ProgressBar({ progress }) {
  return (
    <div class="progress-track">
      <div class="progress-fill" style={{ transform: 'scaleX(' + progress.toFixed(4) + ')' }} />
    </div>
  )
}

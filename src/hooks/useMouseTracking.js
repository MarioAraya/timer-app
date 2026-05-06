import { useState } from 'preact/hooks'

/**
 * Mouse tracking hook for showing/hiding controls
 * Shows controls when mouse is in bottom 20% of container
 */
export function useMouseTracking(containerRef) {
  const [showControls, setShowControls] = useState(false)

  const handleMouseMove = (e) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const mouseY = e.clientY - rect.top
    const containerHeight = rect.height
    const bottomThreshold = containerHeight * 0.8

    setShowControls(mouseY >= bottomThreshold)
  }

  const handleMouseLeave = () => {
    setShowControls(false)
  }

  return {
    showControls,
    handleMouseMove,
    handleMouseLeave
  }
}

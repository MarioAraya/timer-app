import { useState } from 'preact/hooks'

export const useDoubleClick = (onDoubleClick) => {
  const [clickCount, setClickCount] = useState(0)
  const [clickTimer, setClickTimer] = useState(null)

  const handleClick = () => {
    setClickCount(prev => prev + 1)
    
    if (clickTimer) {
      clearTimeout(clickTimer)
    }
    
    const timer = setTimeout(() => {
      if (clickCount + 1 >= 2) {
        onDoubleClick()
      }
      setClickCount(0)
    }, 300)
    
    setClickTimer(timer)
  }

  return handleClick
}
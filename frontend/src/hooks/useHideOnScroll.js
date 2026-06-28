/**
 * useHideOnScroll.js
 * Returns true when the user is scrolling DOWN (nav should hide).
 * Returns false when at top or scrolling UP (nav should show).
 */
import { useState, useEffect } from 'react'

export function useHideOnScroll(threshold = 8) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY

    const onScroll = () => {
      const y     = window.scrollY
      const delta = y - lastY

      if (y < 10) {
        // Always show at the very top
        setHidden(false)
      } else if (delta > threshold) {
        // Scrolling down past threshold → hide
        setHidden(true)
      } else if (delta < -threshold) {
        // Scrolling up past threshold → show
        setHidden(false)
      }

      lastY = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return hidden
}

import { useState, useEffect } from "react"

// User system can indicate reduced motion setting https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

const query = "(prefers-reduced-motion: no-preference)"

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    !window.matchMedia(query).matches
  )
  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    const listener = (event: any) => {
      setPrefersReducedMotion(!event.matches)
    }
    mediaQueryList.addListener(listener)
    return () => {
      mediaQueryList.removeListener(listener)
    }
  }, [])
  return prefersReducedMotion
}

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

/** Follows the OS until the viewer picks a mode; the pick is remembered per device. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(() => {
    try {
      const saved = localStorage.getItem('sdsb-theme')
      return saved === 'light' || saved === 'dark' ? saved : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme
    else delete document.documentElement.dataset.theme
    try {
      if (theme) localStorage.setItem('sdsb-theme', theme)
    } catch {
      /* private mode — the choice just won't persist */
    }
  }, [theme])

  // Track the OS setting live, so the icon stays right if the phone flips to
  // dark mode at sunset while SDSB is open.
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const effective: Theme = theme ?? (systemDark ? 'dark' : 'light')

  return { theme: effective, toggle: () => setTheme(effective === 'dark' ? 'light' : 'dark') }
}

import { useEffect, useState } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'

const KEY = 'sdsb-theme'

/** System (follow the phone), Light or Dark — remembered per device. */
export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(KEY)
      return saved === 'light' || saved === 'dark' ? saved : 'system'
    } catch {
      return 'system'
    }
  })

  useEffect(() => {
    if (mode === 'system') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = mode
    try {
      if (mode === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, mode)
    } catch {
      /* private mode — the choice just won't persist */
    }
  }, [mode])

  return { mode, setMode: setModeState }
}

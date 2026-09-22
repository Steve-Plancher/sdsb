import { useCallback, useEffect, useState } from 'react'
import { api, type UserSettings } from '@/lib/api'

export const DEFAULT_SETTINGS: UserSettings = {
  reminder_offsets: [60],
  default_due_time: '09:00:00',
  timezone: 'UTC',
}

const deviceZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const saved = await api.settings.get()
        // Keep the server's idea of "your time zone" current, so reminders for
        // date-only tasks fire at the right local hour after you travel.
        const zone = deviceZone()
        const next = !saved || saved.timezone !== zone ? await api.settings.save({ timezone: zone }) : saved
        if (!cancelled) setSettings(next)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load settings')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const save = useCallback(async (patch: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
    try {
      setSettings(await api.settings.save(patch))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings')
    }
  }, [])

  return { settings, save, error }
}

export type Settings = ReturnType<typeof useSettings>

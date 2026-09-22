import { addDays, differenceInCalendarDays, format, startOfWeek, subDays } from 'date-fns'

/** Every date key in the app is a local-time `YYYY-MM-DD` string. */
export type DayKey = string

export const toKey = (d: Date): DayKey => format(d, 'yyyy-MM-dd')
export const today = (): DayKey => toKey(new Date())

export function lastNDays(n: number, end = new Date()): DayKey[] {
  return Array.from({ length: n }, (_, i) => toKey(subDays(end, n - 1 - i)))
}

/**
 * Days for a GitHub-style grid: whole weeks, ending on the week containing
 * `end`, so every column is a full Mon-Sun.
 */
export function heatmapDays(weeks: number, end = new Date()): DayKey[] {
  const lastWeekStart = startOfWeek(end, { weekStartsOn: 1 })
  const firstDay = subDays(lastWeekStart, (weeks - 1) * 7)
  return Array.from({ length: weeks * 7 }, (_, i) => toKey(addDays(firstDay, i)))
}

/** Consecutive days ticked, counting back from today. */
export function currentStreak(dates: Set<DayKey>): number {
  let streak = 0
  const cursor = new Date()

  // Yesterday still counts while today is open, so the streak doesn't read as
  // broken just because the day isn't finished yet.
  if (!dates.has(toKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!dates.has(toKey(cursor))) return 0
  }

  while (dates.has(toKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function longestStreak(dates: Set<DayKey>): number {
  const sorted = [...dates].sort()
  let best = 0
  let run = 0
  let prev: string | null = null

  for (const d of sorted) {
    run = prev && differenceInCalendarDays(new Date(d), new Date(prev)) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

export const prettyDay = (key: DayKey) => format(new Date(`${key}T00:00:00`), 'EEE d MMM')

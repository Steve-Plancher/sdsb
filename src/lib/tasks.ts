import { addDays, differenceInCalendarDays } from 'date-fns'
import type { Task } from '@/lib/api'
import { fromKey, toKey, type DayKey } from '@/lib/dates'

export const PRIORITIES: { value: Task['priority']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'med', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export const priorityLabel = (p: Task['priority']) => PRIORITIES.find((x) => x.value === p)?.label ?? 'None'

/** Text colour per priority. Always shown with the word, never colour alone. */
export const priorityTone: Record<Task['priority'], string> = {
  none: 'text-ink-muted',
  low: 'text-ink-muted',
  med: 'text-warning',
  high: 'text-critical',
}

export type DueInfo = { label: string; overdue: boolean; soon: boolean }

/** '15:00:00' → "3:00 PM" in the viewer's locale. */
export function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/**
 * "Today", "Tomorrow · 3:00 PM", "Fri", "Fri 3 Oct" or "Overdue · Mon 21 Sep",
 * relative to now. With a time, a task due earlier today already counts as overdue.
 */
export function describeDue(due: DayKey | null, time: string | null, done: boolean, now = new Date()): DueInfo | null {
  if (!due) return null
  const days = differenceInCalendarDays(fromKey(due), now)
  const d = fromKey(due)
  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' })
  const full = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  const at = time ? ` · ${formatTime(time)}` : ''

  let passed = days < 0
  if (days === 0 && time) {
    const [h, m] = time.split(':').map(Number)
    passed = now >= new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
  }

  if (passed) return { label: done ? `${full}${at}` : `Overdue · ${days === 0 ? 'Today' : full}${at}`, overdue: !done, soon: false }
  if (days === 0) return { label: `Today${at}`, overdue: false, soon: !done }
  if (days === 1) return { label: `Tomorrow${at}`, overdue: false, soon: !done }
  if (days < 7) return { label: `${weekday}${at}`, overdue: false, soon: false }
  return { label: `${full}${at}`, overdue: false, soon: false }
}

export const quickDates = (now = new Date()) => [
  { label: 'Today', value: toKey(now) },
  { label: 'Tomorrow', value: toKey(addDays(now, 1)) },
  { label: 'Next week', value: toKey(addDays(now, 7)) },
]

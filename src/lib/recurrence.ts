import { addDays, addHours, addMonths, addWeeks } from 'date-fns'
import type { Task } from '@/lib/api'
import { formatTime } from '@/lib/tasks'
import { fromKey, toKey, type DayKey } from '@/lib/dates'

export type RepeatUnit = 'hour' | 'day' | 'week' | 'month'

export const REPEAT_UNITS: { value: RepeatUnit; one: string; many: string }[] = [
  { value: 'hour', one: 'hour', many: 'hours' },
  { value: 'day', one: 'day', many: 'days' },
  { value: 'week', one: 'week', many: 'weeks' },
  { value: 'month', one: 'month', many: 'months' },
]

export const repeats = (task: Pick<Task, 'repeat_every' | 'repeat_unit'>) =>
  task.repeat_every != null && task.repeat_unit != null

/** "Every day", "Every 15 days", "Every 4 hours". */
export function describeRepeat(every: number, unit: RepeatUnit): string {
  const names = REPEAT_UNITS.find((u) => u.value === unit)!
  return every === 1 ? `Every ${names.one}` : `Every ${every} ${names.many}`
}

const ADD: Record<RepeatUnit, (d: Date, n: number) => Date> = {
  // addMonths clamps: 31 Jan + 1 month = 28 Feb, and keeps the 15th monthly.
  hour: addHours,
  day: addDays,
  week: addWeeks,
  month: addMonths,
}

/**
 * The next occurrence after completing a repeating task.
 *
 * Steps from the current due moment until it lands in the future, so a task
 * left undone for a week jumps to the next real occurrence instead of a date
 * that has already passed. Returns the same shape the task stores.
 */
export function nextDue(
  dueDate: DayKey,
  dueTime: string | null,
  every: number,
  unit: RepeatUnit,
  now = new Date(),
): { due_date: DayKey; due_time: string | null } {
  const [h, m] = dueTime ? dueTime.split(':').map(Number) : [0, 0]
  const base = fromKey(dueDate)
  let at = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m)

  // Always advance at least once — finishing a task early shouldn't leave it
  // due again the same evening — then keep stepping until it lands ahead of
  // now, so a task left undone for a week skips the occurrences it missed.
  // Capped: a year of hourly steps is the worst realistic case.
  at = ADD[unit](at, every)
  for (let i = 0; i < 9000 && at <= now; i++) at = ADD[unit](at, every)

  return {
    due_date: toKey(at),
    due_time: dueTime ? `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}:00` : null,
  }
}

/** "Fri 3 Oct" / "Fri 3 Oct at 3:00 PM" — the next occurrence, on its own. */
export function formatNext(next: { due_date: DayKey; due_time: string | null }): string {
  const day = fromKey(next.due_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  return next.due_time ? `${day} at ${formatTime(next.due_time)}` : day
}

/** The same moment as a sentence ending, e.g. "next Fri 3 Oct at 3:00 PM". */
export const describeNext = (next: { due_date: DayKey; due_time: string | null }) => `next ${formatNext(next)}`

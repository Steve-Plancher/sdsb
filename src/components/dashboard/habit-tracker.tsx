import { Flame, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Habit } from '@/lib/api'
import { currentStreak, lastNDays, prettyDay, type DayKey } from '@/lib/dates'
import { cn } from '@/lib/utils'

type Props = {
  habits: Habit[]
  /** habit id -> set of ticked day keys. */
  entriesByHabit: Map<number, Set<DayKey>>
  onAdd: (name: string) => void
  onToggle: (habitId: number, date: DayKey) => void
  onRemove: (habit: Habit) => void
}

export function HabitTracker({ habits, entriesByHabit, onAdd, onToggle, onRemove }: Props) {
  const [draft, setDraft] = useState('')
  const week = lastNDays(7)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    onAdd(draft.trim())
    setDraft('')
  }

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Track a new habit…"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface-0 px-3 text-[16px] text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none sm:text-[13px]"
        />
        <Button type="submit" variant="primary" size="md" disabled={!draft.trim()}>
          <Plus size={15} />
          Add
        </Button>
      </form>

      {/* Desktop only: one shared header, since the rows are single-line there. */}
      {habits.length > 0 && (
        <div className="mt-4 hidden items-center gap-3 px-1.5 text-[10px] text-ink-muted sm:flex">
          <span className="flex-1" />
          <span className="w-[46px] shrink-0" />
          <div className="flex shrink-0 gap-[5px]">
            {week.map((d) => (
              <span key={d} className="w-[26px] text-center">
                {prettyDay(d).slice(0, 2)}
              </span>
            ))}
          </div>
          <span className="h-7 w-7 shrink-0" />
        </div>
      )}

      <ul className="mt-1 space-y-1 sm:space-y-0.5">
        {habits.map((habit) => {
          const ticked = entriesByHabit.get(habit.id) ?? new Set<DayKey>()
          const streak = currentStreak(ticked)

          return (
            <li
              key={habit.id}
              className={cn(
                'group rounded-lg px-1.5 py-2 hover:bg-surface-2',
                // Phone: name above, full-width squares below. Desktop: one row.
                'flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 sm:py-1.5',
              )}
            >
              <div className="flex min-w-0 items-center gap-2 sm:flex-1">
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink sm:text-[13px]">
                  {habit.name}
                </span>

                <span
                  className={cn(
                    'flex shrink-0 items-center justify-end gap-0.5 text-[12px] tabular-nums sm:w-[46px]',
                    streak > 0 ? 'text-warning' : 'text-ink-muted',
                  )}
                  title={`${streak} day streak`}
                >
                  <Flame size={12} />
                  {streak}
                </span>

                {/* Always reachable on touch; hover-revealed on desktop. */}
                <Button
                  size="icon"
                  onClick={() => onRemove(habit)}
                  aria-label={`Delete ${habit.name}`}
                  className="shrink-0 hover:text-critical sm:hidden"
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="flex gap-1.5 sm:shrink-0 sm:gap-[5px]">
                {week.map((day) => {
                  const on = ticked.has(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => onToggle(habit.id, day)}
                      aria-label={`${habit.name} on ${prettyDay(day)}`}
                      aria-pressed={on}
                      className={cn(
                        // Phone: stretch to fill, tall enough to tap.
                        'h-9 flex-1 rounded-[7px] border text-[10px] font-medium transition-all',
                        'sm:h-[26px] sm:w-[26px] sm:flex-none sm:rounded-[6px] sm:text-[0px]',
                        on
                          ? 'border-transparent bg-accent text-accent-ink'
                          : 'border-border bg-surface-0 text-ink-muted hover:border-accent',
                      )}
                    >
                      {/* Per-square label carries the day on phones, where there's no header row. */}
                      <span className="sm:hidden">{prettyDay(day).slice(0, 2)}</span>
                    </button>
                  )
                })}
              </div>

              <Button
                size="icon"
                onClick={() => onRemove(habit)}
                aria-label={`Delete ${habit.name}`}
                className="hidden shrink-0 opacity-0 group-hover:opacity-100 hover:text-critical sm:inline-flex"
              >
                <Trash2 size={14} />
              </Button>
            </li>
          )
        })}

        {habits.length === 0 && (
          <li className="px-1.5 py-6 text-center text-[13px] text-ink-muted">
            No habits yet. Add one and start a streak today.
          </li>
        )}
      </ul>
    </div>
  )
}

import { ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { PageTitle, SectionLabel } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { StreakBadge } from '@/components/ui/check-circle'
import type { Brain } from '@/hooks/use-brain'
import { currentStreak, currentWeek, fromKey, prettyDay, today } from '@/lib/dates'
import { href } from '@/lib/router'
import { cn } from '@/lib/utils'

export function HabitsView({ brain }: { brain: Brain }) {
  const [draft, setDraft] = useState('')
  const week = currentWeek()
  const day = today()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    void brain.addHabit(draft.trim())
    setDraft('')
  }

  return (
    <>
      <PageTitle title="Habits" subtitle="Tap a day to tick it. Tap a habit for its history." />

      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="new-habit" className="sr-only">
          New habit
        </label>
        <input
          id="new-habit"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Track a new habit…"
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface-1 px-3.5 text-[16px] text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
        />
        <Button type="submit" variant="primary" className="h-11 px-4 text-[15px]" disabled={!draft.trim()}>
          <Plus size={17} aria-hidden="true" />
          Add
        </Button>
      </form>

      <SectionLabel>This week</SectionLabel>
      {brain.habits.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface-1 px-4 py-6 text-center text-[15px] text-ink-muted">
          No habits yet. Add one above and your streak starts today.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-1">
          {brain.habits.map((habit) => {
            const ticked = brain.entriesByHabit.get(habit.id) ?? new Set<string>()
            return (
              <li key={habit.id} className="px-4 py-3">
                <a href={href.habit(habit.id)} className="flex min-h-[32px] items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-ink">{habit.name}</span>
                  <StreakBadge days={currentStreak(ticked)} />
                  <ChevronRight size={18} className="text-ink-muted" aria-hidden="true" />
                </a>
                <div className="mt-2.5 flex gap-1.5">
                  {week.map((d) => {
                    const on = ticked.has(d)
                    const isToday = d === day
                    const future = d > day
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => brain.toggleEntry(habit.id, d)}
                        disabled={future}
                        aria-pressed={on}
                        aria-label={`${habit.name}, ${prettyDay(d)}${on ? ', done' : ''}`}
                        className={cn(
                          'flex h-11 flex-1 flex-col items-center justify-center rounded-xl border text-[11px] leading-tight font-semibold transition-colors',
                          on
                            ? 'border-transparent bg-accent text-accent-ink'
                            : isToday
                              ? 'border-accent bg-surface-0 text-ink'
                              : future
                                ? 'border-border bg-surface-0 text-ink-muted opacity-40'
                                : 'border-border bg-surface-0 text-ink-muted hover:border-accent',
                        )}
                      >
                        <span>{fromKey(d).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                        <span className="text-[13px] tabular-nums">{fromKey(d).getDate()}</span>
                      </button>
                    )
                  })}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

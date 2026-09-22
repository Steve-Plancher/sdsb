import { ChevronLeft, ChevronRight, Flame, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { SectionLabel } from '@/components/layout/app-shell'
import type { Brain } from '@/hooks/use-brain'
import { currentStreak, fromKey, lastNDays, longestStreak, monthGrid, prettyDay, today } from '@/lib/dates'
import { href } from '@/lib/router'
import { cn } from '@/lib/utils'

export function HabitDetailView({ brain, habitId }: { brain: Brain; habitId: number }) {
  const habit = brain.habits.find((h) => h.id === habitId)
  const now = new Date()
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const back = (
    <a href={href.habits} className="-ml-1 mb-3 inline-flex items-center gap-0.5 text-[16px] font-semibold text-accent">
      <ChevronLeft size={22} aria-hidden="true" />
      Habits
    </a>
  )

  if (!habit) {
    return (
      <>
        {back}
        <p className="rounded-2xl border border-border bg-surface-1 px-4 py-6 text-center text-[15px] text-ink-muted">
          {brain.loading ? 'Loading…' : 'This habit doesn’t exist any more.'}
        </p>
      </>
    )
  }

  const ticked = brain.entriesByHabit.get(habit.id) ?? new Set<string>()
  const day = today()
  const streak = currentStreak(ticked)
  const best = longestStreak(ticked)
  const thisWeek = lastNDays(7).filter((d) => ticked.has(d)).length
  const monthSoFar = lastNDays(now.getDate())
  const monthPct = Math.round((monthSoFar.filter((d) => ticked.has(d)).length / monthSoFar.length) * 100)

  const grid = monthGrid(month.y, month.m)
  const monthName = new Date(month.y, month.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const isCurrentMonth = month.y === now.getFullYear() && month.m === now.getMonth()
  const shift = (by: number) =>
    setMonth(({ y, m }) => {
      const d = new Date(y, m + by, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })

  return (
    <>
      {back}
      <h1 className="mb-5 text-[28px] leading-tight font-bold tracking-tight break-words text-ink">{habit.name}</h1>

      <section className="flex items-center gap-4 rounded-2xl border border-border bg-surface-1 p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-2">
          <Flame size={28} className={streak > 0 ? 'fill-current text-streak-icon' : 'text-ink-muted'} aria-hidden="true" />
        </span>
        <div>
          <p className="flex items-baseline gap-1.5">
            <span className="text-[34px] leading-none font-bold text-ink tabular-nums">{streak}</span>
            <span className="text-[16px] text-ink-secondary">day streak</span>
          </p>
          <p className="mt-1 text-[14px] text-ink-muted">Best so far: {best} {best === 1 ? 'day' : 'days'}</p>
        </div>
      </section>

      <section className="mt-3 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-surface-1 py-3.5 text-center">
        {[
          [`${thisWeek}/7`, 'This week'],
          [`${monthPct}%`, 'This month'],
          [String(ticked.size), 'All time'],
        ].map(([value, label]) => (
          <div key={label}>
            <p className="text-[20px] font-bold text-ink tabular-nums">{value}</p>
            <p className="mt-0.5 text-[13px] text-ink-muted">{label}</p>
          </div>
        ))}
      </section>

      <SectionLabel>History</SectionLabel>
      <section className="rounded-2xl border border-border bg-surface-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-full text-accent hover:bg-surface-2">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-[16px] font-bold text-ink">{monthName}</h2>
          <button
            type="button"
            onClick={() => shift(1)}
            disabled={isCurrentMonth}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full text-accent hover:bg-surface-2 disabled:text-ink-muted disabled:opacity-40"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[12px] font-semibold text-ink-muted">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} className="pb-1.5" aria-hidden="true">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {grid.flat().map((d, i) => {
            if (!d) return <span key={i} />
            const on = ticked.has(d)
            const future = d > day
            return (
              <div key={d} className="flex justify-center">
                <button
                  type="button"
                  disabled={future}
                  onClick={() => brain.toggleEntry(habit.id, d)}
                  aria-pressed={on}
                  aria-label={`${prettyDay(d)}${on ? ', done' : ''}`}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-[15px] tabular-nums transition-colors',
                    on && 'bg-accent font-bold text-accent-ink',
                    !on && !future && 'text-ink hover:bg-surface-2',
                    !on && d === day && 'font-bold ring-2 ring-accent ring-inset',
                    future && 'text-ink-muted opacity-40',
                  )}
                >
                  {fromKey(d).getDate()}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <div className="mt-7">
        {confirmDelete ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                void brain.removeHabit(habit)
                window.location.hash = href.habits
              }}
              className="h-11 flex-1 rounded-xl bg-critical px-3 text-[15px] font-semibold text-accent-ink"
            >
              Delete “{habit.name}” and its history
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="h-11 rounded-xl border border-border px-4 text-[15px] font-semibold text-ink"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-1 text-[15px] font-semibold text-critical"
          >
            <Trash2 size={16} aria-hidden="true" />
            Delete habit
          </button>
        )}
      </div>
    </>
  )
}

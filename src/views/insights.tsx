import { useMemo, useState } from 'react'
import { HabitHeatmap } from '@/components/dashboard/habit-heatmap'
import { TrendChart, type TrendPoint } from '@/components/dashboard/trend-chart'
import { PageTitle, SectionLabel } from '@/components/layout/app-shell'
import type { Brain } from '@/hooks/use-brain'
import { fromKey, lastNDays, longestStreak, toKey, WEEKDAY_NAMES, weekdayTotals } from '@/lib/dates'
import { cn } from '@/lib/utils'

type Range = 'week' | 'month' | 'year'

const RANGES: { value: Range; label: string; days: number; heatmapWeeks: number; noun: string }[] = [
  { value: 'week', label: 'Week', days: 7, heatmapWeeks: 13, noun: 'last 7 days' },
  { value: 'month', label: 'Month', days: 30, heatmapWeeks: 13, noun: 'last 30 days' },
  { value: 'year', label: 'Year', days: 364, heatmapWeeks: 52, noun: 'last 12 months' },
]

const short = (key: string) => fromKey(key).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

export function InsightsView({ brain }: { brain: Brain }) {
  const [range, setRange] = useState<Range>('month')
  const r = RANGES.find((x) => x.value === range)!
  const habitsCount = brain.habits.length

  const { points, max, unit } = useMemo(() => {
    const days = lastNDays(r.days)
    if (range !== 'year') {
      const pts: TrendPoint[] = days.map((d) => ({
        key: d,
        tick: range === 'week' ? fromKey(d).toLocaleDateString(undefined, { weekday: 'short' }) : short(d),
        tooltip: fromKey(d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
        value: brain.countsByDay.get(d) ?? 0,
      }))
      return { points: pts, max: habitsCount, unit: 'habits done' }
    }
    // A year of daily points is noise on a phone; sum each week instead.
    const pts: TrendPoint[] = []
    for (let i = 0; i < days.length; i += 7) {
      const wk = days.slice(i, i + 7)
      pts.push({
        key: wk[0],
        tick: fromKey(wk[0]).toLocaleDateString(undefined, { month: 'short' }),
        tooltip: `Week of ${short(wk[0])}`,
        value: wk.reduce((s, d) => s + (brain.countsByDay.get(d) ?? 0), 0),
      })
    }
    return { points: pts, max: habitsCount * 7, unit: 'check-ins' }
  }, [brain.countsByDay, habitsCount, r.days, range])

  const stats = useMemo(() => {
    const days = lastNDays(r.days)
    const checkIns = days.reduce((s, d) => s + (brain.countsByDay.get(d) ?? 0), 0)
    const possible = habitsCount * days.length
    const rate = possible ? Math.round((checkIns / possible) * 100) : 0

    const byWeekday = weekdayTotals(days, brain.countsByDay)
    const top = Math.max(...byWeekday)
    const bestDay = top > 0 ? WEEKDAY_NAMES[byWeekday.indexOf(top)] : '—'

    const since = days[0]
    const tasksDone = brain.tasks.filter((t) => t.completed_at && toKey(new Date(t.completed_at)) >= since).length

    let longest = { days: 0, name: '' }
    for (const h of brain.habits) {
      const n = longestStreak(brain.entriesByHabit.get(h.id) ?? new Set())
      if (n > longest.days) longest = { days: n, name: h.name }
    }
    return { rate, bestDay, tasksDone, longest }
  }, [brain.countsByDay, brain.entriesByHabit, brain.habits, brain.tasks, habitsCount, r.days])

  return (
    <>
      <PageTitle title="Insights" />

      <div role="tablist" aria-label="Time range" className="flex gap-1 rounded-xl bg-surface-2 p-1">
        {RANGES.map((x) => (
          <button
            key={x.value}
            type="button"
            role="tab"
            aria-selected={range === x.value}
            onClick={() => setRange(x.value)}
            className={cn(
              'h-9 flex-1 rounded-lg text-[14px] font-semibold transition-colors',
              range === x.value ? 'bg-surface-1 text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-surface-1 p-4">
        <h2 className="text-[16px] font-bold text-ink">Habits completed</h2>
        <p className="mb-3 text-[13px] text-ink-muted">
          {range === 'year' ? 'Check-ins per week' : 'Per day'}, {r.noun}
        </p>
        <TrendChart data={points} max={max} unit={unit} />
      </section>

      <section className="mt-3 rounded-2xl border border-border bg-surface-1 p-4">
        <h2 className="text-[16px] font-bold text-ink">Consistency</h2>
        <p className="mb-3 text-[13px] text-ink-muted">
          Each day shaded by how many habits you did, {range === 'year' ? 'last 12 months' : 'last 3 months'}
        </p>
        <HabitHeatmap countsByDay={brain.countsByDay} total={Math.max(habitsCount, 1)} weeks={r.heatmapWeeks} />
      </section>

      <SectionLabel>Highlights</SectionLabel>
      <dl className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-1">
        {[
          ['Completion rate', `${stats.rate}%`],
          ['Tasks completed', String(stats.tasksDone)],
          ['Best day', stats.bestDay],
          ['Longest streak', stats.longest.days ? `${stats.longest.days} days · ${stats.longest.name}` : '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex min-h-[48px] items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-[16px] text-ink">{label}</dt>
            <dd className="min-w-0 truncate text-right text-[16px] text-ink-muted tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 px-4 text-[13px] text-ink-muted">
        Rate, tasks and best day cover the {r.noun}. Longest streak is all time.
      </p>
    </>
  )
}

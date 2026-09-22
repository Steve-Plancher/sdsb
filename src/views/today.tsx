import { ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { PageTitle, SectionLabel } from '@/components/layout/app-shell'
import { TaskList } from '@/components/dashboard/task-list'
import { CheckCircle, StreakBadge } from '@/components/ui/check-circle'
import { ProgressRing } from '@/components/ui/progress-ring'
import type { Brain } from '@/hooks/use-brain'
import { currentStreak, today } from '@/lib/dates'
import { href } from '@/lib/router'

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

export function TodayView({ brain }: { brain: Brain }) {
  const day = today()

  const rows = useMemo(
    () =>
      brain.habits.map((h) => {
        const ticked = brain.entriesByHabit.get(h.id) ?? new Set<string>()
        return { habit: h, done: ticked.has(day), streak: currentStreak(ticked) }
      }),
    [brain.habits, brain.entriesByHabit, day],
  )

  const done = rows.filter((r) => r.done).length
  const total = rows.length
  const best = rows.reduce<(typeof rows)[number] | null>((b, r) => (!b || r.streak > b.streak ? r : b), null)

  const headline =
    total === 0
      ? 'No habits yet'
      : done === total
        ? 'Every habit done today'
        : `${WORDS[done] ?? done} ${done === 1 ? 'habit' : 'habits'} down`
  const subline =
    total === 0
      ? 'Add one on the Habits tab to start a streak.'
      : best && best.streak > 0
        ? `${best.streak}-day streak on ${best.habit.name}`
        : `${total - done} to go today`

  return (
    <>
      <PageTitle
        title="Today"
        subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
      />

      <section className="flex items-center gap-4 rounded-2xl border border-border bg-surface-1 p-4">
        <ProgressRing done={done} total={total} />
        <div className="min-w-0">
          <p className="text-[17px] font-bold text-ink">{headline}</p>
          <p className="mt-0.5 text-[14px] text-ink-muted">{subline}</p>
        </div>
      </section>

      <SectionLabel>Tasks</SectionLabel>
      <section className="overflow-hidden rounded-2xl border border-border bg-surface-1">
        <TaskList tasks={brain.tasks} onAdd={brain.addTask} onToggle={brain.toggleTask} onRemove={brain.removeTask} />
      </section>

      <SectionLabel
        action={
          <a href={href.habits} className="text-[14px] font-semibold text-accent">
            Manage
          </a>
        }
      >
        Habits
      </SectionLabel>
      <section className="overflow-hidden rounded-2xl border border-border bg-surface-1">
        {rows.length === 0 ? (
          <a href={href.habits} className="flex items-center justify-between px-4 py-4 text-[15px] text-accent">
            Add your first habit
            <ChevronRight size={18} aria-hidden="true" />
          </a>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map(({ habit, done: isDone, streak }) => (
              <li key={habit.id} className="flex min-h-[52px] items-center gap-3 px-4">
                <a href={href.habit(habit.id)} className="min-w-0 flex-1 truncate text-[16px] text-ink">
                  {habit.name}
                </a>
                <StreakBadge days={streak} />
                <CheckCircle
                  checked={isDone}
                  onToggle={() => brain.toggleEntry(habit.id, day)}
                  label={isDone ? `Untick ${habit.name} for today` : `Tick ${habit.name} for today`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

import { Activity, CheckCircle2, Flame, LogOut, Moon, Sun, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SignIn } from '@/components/auth/sign-in'
import { SdsbWordmark, SdsbMark } from '@/components/brand/logo'
import { HabitHeatmap } from '@/components/dashboard/habit-heatmap'
import { HabitTracker } from '@/components/dashboard/habit-tracker'
import { TaskList } from '@/components/dashboard/task-list'
import { WeeklyChart } from '@/components/dashboard/weekly-chart'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { StatTile } from '@/components/ui/stat-tile'
import { useAuth } from '@/hooks/use-auth'
import { useBrain } from '@/hooks/use-brain'
import { currentStreak, lastNDays, today } from '@/lib/dates'
import { supabase } from '@/lib/supabase'

type Theme = 'light' | 'dark'

/** Follows the OS until the viewer picks a mode; the pick is remembered per device. */
function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(() => {
    try {
      const saved = localStorage.getItem('sdsb-theme')
      return saved === 'light' || saved === 'dark' ? saved : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme
    else delete document.documentElement.dataset.theme
    try {
      if (theme) localStorage.setItem('sdsb-theme', theme)
    } catch {
      /* private mode — the choice just won't persist */
    }
  }, [theme])

  // Track the OS setting live, so the icon stays right if the phone flips to
  // dark mode at sunset while SDSB is open.
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const effective: Theme = theme ?? (systemDark ? 'dark' : 'light')

  return { theme: effective, toggle: () => setTheme(effective === 'dark' ? 'light' : 'dark') }
}

export default function App() {
  const session = useAuth()

  if (session === undefined) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <SdsbMark size={48} className="animate-pulse" />
      </div>
    )
  }

  return session ? <Dashboard email={session.user.email ?? ''} /> : <SignIn />
}

function Dashboard({ email }: { email: string }) {
  const brain = useBrain()
  const { theme, toggle } = useTheme()
  const now = today()

  const stats = useMemo(() => {
    const activeHabits = brain.habits.length
    const doneToday = brain.countsByDay.get(now) ?? 0

    // The headline streak is the best single run across habits — the thing
    // you'd actually be proud of, not an average.
    const bestStreak = brain.habits.reduce((best, h) => {
      const s = currentStreak(brain.entriesByHabit.get(h.id) ?? new Set())
      return Math.max(best, s)
    }, 0)

    const last30 = lastNDays(30)
    const possible = activeHabits * 30
    const completed = last30.reduce((sum, d) => sum + (brain.countsByDay.get(d) ?? 0), 0)
    const consistency = possible ? Math.round((completed / possible) * 100) : 0

    return {
      activeHabits,
      doneToday,
      bestStreak,
      consistency,
      openTasks: brain.tasks.filter((t) => !t.done).length,
      doneTasks: brain.tasks.filter((t) => t.done).length,
    }
  }, [brain.habits, brain.tasks, brain.countsByDay, brain.entriesByHabit, now])

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-0/85 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex-1">
            <SdsbWordmark size={26} />
            <p className="mt-0.5 text-[12px] text-ink-muted">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <Button size="icon" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </Button>
          <Button
            size="icon"
            onClick={() => void supabase.auth.signOut()}
            aria-label={`Sign out ${email}`}
            title={`Signed in as ${email}`}
          >
            <LogOut size={15} />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-3 px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:space-y-4 sm:px-6 sm:py-6">
        {brain.error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-critical/40 bg-surface-1 px-4 py-3 text-[13px] text-ink"
          >
            <span className="flex-1">
              <span className="font-semibold text-critical">Something didn’t save.</span> {brain.error}
            </span>
            <button type="button" onClick={brain.dismissError} aria-label="Dismiss" className="text-ink-muted hover:text-ink">
              <X size={15} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4" aria-busy={brain.loading}>
          <StatTile
            label="Today"
            value={stats.doneToday}
            unit={`/ ${stats.activeHabits}`}
            footer="habits ticked off"
            icon={<CheckCircle2 size={13} />}
            tone={stats.activeHabits > 0 && stats.doneToday === stats.activeHabits ? 'accent' : 'neutral'}
          />
          <StatTile
            label="Best streak"
            value={stats.bestStreak}
            unit="days"
            footer="running right now"
            icon={<Flame size={13} className="text-streak-icon" />}
            tone={stats.bestStreak > 0 ? 'accent' : 'neutral'}
          />
          <StatTile
            label="Consistency"
            value={stats.consistency}
            unit="%"
            footer="over the last 30 days"
            icon={<Activity size={13} />}
          />
          <StatTile
            label="Open tasks"
            value={stats.openTasks}
            footer={`${stats.doneTasks} done`}
            icon={<CheckCircle2 size={13} />}
          />
        </div>

        <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Today’s tasks" subtitle="What you’re getting done" />
            <CardBody>
              <TaskList
                tasks={brain.tasks}
                onAdd={brain.addTask}
                onToggle={brain.toggleTask}
                onRemove={brain.removeTask}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Habits" subtitle="Last 7 days — toggle any day" />
            <CardBody>
              <HabitTracker
                habits={brain.habits}
                entriesByHabit={brain.entriesByHabit}
                onAdd={brain.addHabit}
                onToggle={brain.toggleEntry}
                onRemove={brain.removeHabit}
              />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Momentum" subtitle="Habits completed per day over the last 30 days" />
          <CardBody>
            <WeeklyChart countsByDay={brain.countsByDay} total={Math.max(stats.activeHabits, 1)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Last six months" subtitle="Every day, shaded by how much you did" />
          <CardBody>
            <HabitHeatmap countsByDay={brain.countsByDay} total={Math.max(stats.activeHabits, 1)} />
          </CardBody>
        </Card>
      </main>
    </div>
  )
}

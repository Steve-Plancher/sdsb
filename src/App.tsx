import { X } from 'lucide-react'
import { SignIn } from '@/components/auth/sign-in'
import { SdsbMark } from '@/components/brand/logo'
import { AppShell } from '@/components/layout/app-shell'
import { useAuth } from '@/hooks/use-auth'
import { useBrain } from '@/hooks/use-brain'
import { useTheme } from '@/hooks/use-theme'
import { useRoute } from '@/lib/router'
import { supabase } from '@/lib/supabase'
import { HabitDetailView } from '@/views/habit-detail'
import { HabitsView } from '@/views/habits'
import { InsightsView } from '@/views/insights'
import { TaskDetailView } from '@/views/task-detail'
import { TodayView } from '@/views/today'

export default function App() {
  const session = useAuth()

  if (session === undefined) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <SdsbMark size={48} className="animate-pulse" />
      </div>
    )
  }

  return session ? <SignedIn email={session.user.email ?? ''} /> : <SignIn />
}

function SignedIn({ email }: { email: string }) {
  const brain = useBrain()
  const route = useRoute()
  const { theme, toggle } = useTheme()

  return (
    <AppShell
      route={route}
      theme={theme}
      onToggleTheme={toggle}
      onSignOut={() => void supabase.auth.signOut()}
      email={email}
    >
      {brain.error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-xl border border-critical/40 bg-surface-1 px-4 py-3 text-[14px] text-ink"
        >
          <span className="flex-1">
            <span className="font-semibold text-critical">Something didn’t save.</span> {brain.error}
          </span>
          <button type="button" onClick={brain.dismissError} aria-label="Dismiss" className="text-ink-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>
      )}

      {route.tab === 'today' &&
        ('taskId' in route ? <TaskDetailView brain={brain} taskId={route.taskId} /> : <TodayView brain={brain} />)}
      {route.tab === 'habits' &&
        ('habitId' in route ? <HabitDetailView brain={brain} habitId={route.habitId} /> : <HabitsView brain={brain} />)}
      {route.tab === 'insights' && <InsightsView brain={brain} />}
    </AppShell>
  )
}

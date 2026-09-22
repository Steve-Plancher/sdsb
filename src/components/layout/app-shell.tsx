import { ChartColumn, ListChecks, LogOut, Moon, Sprout, Sun, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { SdsbWordmark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { href, type Route } from '@/lib/router'
import { cn } from '@/lib/utils'

const TABS: { tab: Route['tab']; label: string; href: string; icon: LucideIcon }[] = [
  { tab: 'today', label: 'Today', href: href.today, icon: ListChecks },
  { tab: 'habits', label: 'Habits', href: href.habits, icon: Sprout },
  { tab: 'insights', label: 'Insights', href: href.insights, icon: ChartColumn },
]

type Props = {
  route: Route
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onSignOut: () => void
  email: string
  children: ReactNode
}

export function AppShell({ route, theme, onToggleTheme, onSignOut, email, children }: Props) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-0/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <a href={href.today} aria-label="SDSB — Today" className="mr-auto sm:mr-4">
            <SdsbWordmark size={24} />
          </a>

          {/* Wider screens: tabs live in the header. */}
          <nav aria-label="Sections" className="mr-auto hidden gap-1 sm:flex">
            {TABS.map(({ tab, label, href: to }) => (
              <a
                key={tab}
                href={to}
                aria-current={route.tab === tab ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-[14px] font-semibold transition-colors',
                  route.tab === tab ? 'bg-surface-2 text-accent' : 'text-ink-muted hover:text-ink',
                )}
              >
                {label}
              </a>
            ))}
          </nav>

          <Button size="icon" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <Button size="icon" onClick={onSignOut} aria-label={`Sign out ${email}`} title={`Signed in as ${email}`}>
            <LogOut size={16} />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:px-6 sm:pb-12">
        {children}
      </main>

      {/* Phones: an iOS-style tab bar pinned to the bottom. */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-0/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
      >
        <div className="flex h-[52px]">
          {TABS.map(({ tab, label, href: to, icon: Icon }) => {
            const active = route.tab === tab
            return (
              <a
                key={tab}
                href={to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold',
                  active ? 'text-accent' : 'text-ink-muted',
                )}
              >
                <Icon size={23} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                {label}
              </a>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

/** iOS-style large title with an optional line under it and a trailing action. */
export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[32px] leading-[1.15] font-bold tracking-tight text-ink sm:text-[34px]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[15px] text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/** Small caps heading above a grouped list, as in iOS Settings. */
export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-7 mb-2 flex items-baseline justify-between px-4">
      <h2 className="text-[13px] font-semibold tracking-wide text-ink-muted uppercase">{children}</h2>
      {action}
    </div>
  )
}

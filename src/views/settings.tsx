import { Bell, BellOff, Check, ChevronRight, History, LogOut, Share, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageTitle, SectionLabel } from '@/components/layout/app-shell'
import type { Settings } from '@/hooks/use-settings'
import type { ThemeMode } from '@/hooks/use-theme'
import { REMINDER_OFFSETS, type ReminderOffset } from '@/lib/api'
import { currentSubscription, disablePush, enablePush, pushSupport, sendTestPush } from '@/lib/push'
import { href } from '@/lib/router'
import { cn } from '@/lib/utils'

const OFFSET_LABELS: Record<ReminderOffset, string> = {
  30: '30 minutes before',
  60: '1 hour before',
  180: '3 hours before',
  1440: '1 day before',
  2880: '2 days before',
  7200: '5 days before',
}

type Props = {
  settings: Settings
  mode: ThemeMode
  onMode: (m: ThemeMode) => void
  email: string
  onSignOut: () => void
}

export function SettingsView({ settings, mode, onMode, email, onSignOut }: Props) {
  return (
    <>
      <PageTitle title="Settings" />

      <SectionLabel>Appearance</SectionLabel>
      <div role="radiogroup" aria-label="Appearance" className="flex gap-1 rounded-xl bg-surface-2 p-1">
        {(
          [
            ['system', 'System'],
            ['light', 'Light'],
            ['dark', 'Dark'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => onMode(value)}
            className={cn(
              'h-10 flex-1 rounded-lg text-[15px] font-semibold transition-colors',
              mode === value ? 'bg-surface-1 text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 px-4 text-[13px] text-ink-muted">System follows your phone’s light or dark mode.</p>

      <SectionLabel>Notifications</SectionLabel>
      <NotificationsCard />

      <SectionLabel>Remind me about tasks</SectionLabel>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-1">
        {REMINDER_OFFSETS.map((offset) => {
          const on = settings.settings.reminder_offsets.includes(offset)
          return (
            <li key={offset}>
              <label className="flex min-h-[52px] cursor-pointer items-center gap-3 px-4">
                <span className="flex-1 text-[16px] text-ink">{OFFSET_LABELS[offset]}</span>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => {
                    const next = on
                      ? settings.settings.reminder_offsets.filter((o) => o !== offset)
                      : [...settings.settings.reminder_offsets, offset].sort((a, b) => a - b)
                    void settings.save({ reminder_offsets: next })
                  }}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] border-border-strong text-accent-ink transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60"
                >
                  {on && <Check size={15} strokeWidth={3} />}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 px-4 text-[13px] text-ink-muted">
        For open tasks with a due date. Tick as many as you like — each one sends its own reminder.
      </p>

      <div className="mt-3 flex min-h-[52px] items-center gap-3 rounded-2xl border border-border bg-surface-1 px-4">
        <label htmlFor="default-time" className="flex-1 text-[16px] text-ink">
          Tasks with no time are due at
        </label>
        <input
          id="default-time"
          type="time"
          value={settings.settings.default_due_time.slice(0, 5)}
          onChange={(e) => e.target.value && void settings.save({ default_due_time: `${e.target.value}:00` })}
          className="rounded-lg bg-surface-2 px-2.5 py-1.5 text-[16px] font-semibold text-ink tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        />
      </div>

      {settings.error && (
        <p className="mt-2 px-4 text-[13px] text-critical" role="alert">
          {settings.error}
        </p>
      )}

      <SectionLabel>History</SectionLabel>
      <a
        href={href.history}
        className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-border bg-surface-1 px-4"
      >
        <History size={20} className="text-accent" aria-hidden="true" />
        <span className="flex-1 text-[16px] text-ink">Completed tasks</span>
        <ChevronRight size={18} className="text-ink-muted" aria-hidden="true" />
      </a>
      <p className="mt-2 px-4 text-[13px] text-ink-muted">
        Every task you’ve ticked off, including each time a repeating task came round.
      </p>

      <SectionLabel>Account</SectionLabel>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface-1">
        <div className="border-b border-border px-4 py-3">
          <p className="text-[13px] text-ink-muted">Signed in as</p>
          <p className="mt-0.5 truncate text-[16px] text-ink">{email}</p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex min-h-[52px] w-full items-center gap-2 px-4 text-[16px] font-semibold text-critical"
        >
          <LogOut size={18} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </>
  )
}

/** This device's notification state, with the one action that makes sense for it. */
function NotificationsCard() {
  const support = pushSupport()
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const permission = support === 'ok' ? Notification.permission : 'default'

  useEffect(() => {
    void currentSubscription().then((s) => setSubscribed(!!s))
  }, [])

  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    setMessage(null)
    try {
      await work()
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setBusy(false)
    }
  }

  const card = 'rounded-2xl border border-border bg-surface-1 p-4'

  if (support === 'ios-needs-home-screen') {
    return (
      <div className={card}>
        <p className="flex items-center gap-2 text-[16px] font-semibold text-ink">
          <Smartphone size={18} className="text-accent" aria-hidden="true" />
          Open SDSB from your Home Screen
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-secondary">
          iPhone only allows notifications for web apps opened from the Home Screen. In Safari, tap{' '}
          <Share size={14} className="inline align-[-2px]" aria-label="Share" /> then <b>Add to Home Screen</b>, open
          SDSB from its icon, and come back here.
        </p>
      </div>
    )
  }

  if (support === 'unsupported') {
    return (
      <p className={cn(card, 'text-[15px] text-ink-muted')}>This browser can’t show notifications from SDSB.</p>
    )
  }

  if (permission === 'denied') {
    return (
      <div className={card}>
        <p className="flex items-center gap-2 text-[16px] font-semibold text-ink">
          <BellOff size={18} className="text-critical" aria-hidden="true" />
          Notifications are blocked
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-secondary">
          Turn them back on in your phone’s Settings → Notifications → SDSB, then reopen SDSB.
        </p>
      </div>
    )
  }

  return (
    <div className={card}>
      <p className="flex items-center gap-2 text-[16px] font-semibold text-ink">
        <Bell size={18} className={subscribed ? 'text-accent' : 'text-ink-muted'} aria-hidden="true" />
        {subscribed ? 'On for this device' : 'Off on this device'}
      </p>
      <p className="mt-1 text-[14px] text-ink-muted">
        {subscribed
          ? 'Reminders arrive even when SDSB is closed.'
          : 'Turn on to get task reminders on this phone or computer.'}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {subscribed ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const r = await sendTestPush()
                  setMessage(
                    r.sent > 0
                      ? { tone: 'ok', text: `Sent to ${r.sent} ${r.sent === 1 ? 'device' : 'devices'}. It should appear in a few seconds.` }
                      : { tone: 'error', text: 'No device received it. Try turning notifications off and on again.' },
                  )
                })
              }
              className="h-11 rounded-xl bg-accent px-4 text-[15px] font-semibold text-accent-ink disabled:opacity-50"
            >
              Send test notification
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await disablePush()
                  setSubscribed(false)
                })
              }
              className="h-11 rounded-xl border border-border px-4 text-[15px] font-semibold text-ink disabled:opacity-50"
            >
              Turn off
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy || subscribed === null}
            onClick={() =>
              run(async () => {
                const result = await enablePush()
                if (result === 'denied') setMessage({ tone: 'error', text: 'Permission wasn’t given, so notifications stay off.' })
                else setSubscribed(true)
              })
            }
            className="h-11 rounded-xl bg-accent px-4 text-[15px] font-semibold text-accent-ink disabled:opacity-50"
          >
            {busy ? 'Turning on…' : 'Turn on notifications'}
          </button>
        )}
      </div>

      {message && (
        <p className={cn('mt-3 text-[13px]', message.tone === 'ok' ? 'text-accent' : 'text-critical')} role="status">
          {message.text}
        </p>
      )}
    </div>
  )
}

import { ChevronLeft, Repeat } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageTitle } from '@/components/layout/app-shell'
import { api, type TaskCompletion } from '@/lib/api'
import { toKey } from '@/lib/dates'
import { href } from '@/lib/router'

const PAGE = 100

/** Read-only record of everything ticked off, newest first. */
export function HistoryView() {
  const [rows, setRows] = useState<TaskCompletion[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [more, setMore] = useState(false)

  const load = async (before?: string) => {
    try {
      const page = await api.completions.list(PAGE, before)
      setRows((prev) => (before ? [...prev, ...page] : page))
      setMore(page.length === PAGE)
      setState('ready')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not load your history')
      setState('error')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  // Group by the local day each task was completed.
  const days = new Map<string, TaskCompletion[]>()
  for (const row of rows) {
    const key = toKey(new Date(row.completed_at))
    if (!days.has(key)) days.set(key, [])
    days.get(key)!.push(row)
  }

  const dayLabel = (key: string) => {
    const date = new Date(`${key}T00:00:00`)
    const today = toKey(new Date())
    if (key === today) return 'Today'
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (key === toKey(yesterday)) return 'Yesterday'
    return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <>
      <a href={href.settings} className="-ml-1 mb-3 inline-flex items-center gap-0.5 text-[16px] font-semibold text-accent">
        <ChevronLeft size={22} aria-hidden="true" />
        Settings
      </a>
      <PageTitle title="Completed tasks" subtitle="Everything you’ve ticked off, including repeats." />

      {state === 'loading' && <p className="px-4 text-[15px] text-ink-muted">Loading…</p>}
      {state === 'error' && (
        <p className="rounded-2xl border border-border bg-surface-1 px-4 py-6 text-center text-[15px] text-critical" role="alert">
          {message}
        </p>
      )}

      {state === 'ready' && rows.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface-1 px-4 py-6 text-center text-[15px] text-ink-muted">
          Nothing here yet. Tick a task off and it shows up.
        </p>
      )}

      {[...days.entries()].map(([day, entries]) => (
        <section key={day} className="mb-5">
          <h2 className="mb-2 px-4 text-[13px] font-semibold tracking-wide text-ink-muted uppercase">{dayLabel(day)}</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-1">
            {entries.map((row) => (
              <li key={row.id} className="flex min-h-[52px] items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1 text-[16px] break-words text-ink">{row.title}</span>
                {row.was_recurring && <Repeat size={15} className="shrink-0 text-ink-muted" aria-label="Repeating task" />}
                <span className="shrink-0 text-[14px] text-ink-muted tabular-nums">
                  {new Date(row.completed_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {more && (
        <button
          type="button"
          onClick={() => void load(rows[rows.length - 1]?.completed_at)}
          className="h-11 w-full rounded-xl border border-border bg-surface-1 text-[15px] font-semibold text-ink"
        >
          Load more
        </button>
      )}
    </>
  )
}

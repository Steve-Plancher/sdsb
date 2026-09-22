import { CalendarDays, ChevronLeft, Flag, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SectionLabel } from '@/components/layout/app-shell'
import { CheckCircle } from '@/components/ui/check-circle'
import type { Brain } from '@/hooks/use-brain'
import { href } from '@/lib/router'
import { describeDue, PRIORITIES, priorityTone, quickDates } from '@/lib/tasks'
import { cn } from '@/lib/utils'

export function TaskDetailView({ brain, taskId }: { brain: Brain; taskId: number }) {
  const task = brain.tasks.find((t) => t.id === taskId)
  const [title, setTitle] = useState(task?.title ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Pick up the title once the task list has loaded (deep link / refresh).
  useEffect(() => {
    if (task) setTitle(task.title)
  }, [task?.id])

  // Save a rename shortly after typing stops, not only on blur: a swipe-back
  // gesture can leave the screen without the field ever losing focus.
  const latest = useRef({ task, title, brain })
  latest.current = { task, title, brain }
  useEffect(() => {
    const flush = () => {
      const { task: t, title: typed, brain: b } = latest.current
      const next = typed.trim()
      if (t && next && next !== t.title) void b.updateTask(t, { title: next })
    }
    const timer = window.setTimeout(flush, 700)
    return () => window.clearTimeout(timer)
  }, [title])
  // …and flush whatever is pending when the screen goes away.
  useEffect(
    () => () => {
      const { task: t, title: typed, brain: b } = latest.current
      const next = typed.trim()
      if (t && next && next !== t.title) void b.updateTask(t, { title: next })
    },
    [],
  )

  const back = (
    <a href={href.today} className="-ml-1 mb-3 inline-flex items-center gap-0.5 text-[16px] font-semibold text-accent">
      <ChevronLeft size={22} aria-hidden="true" />
      Today
    </a>
  )

  if (!task) {
    return (
      <>
        {back}
        <p className="rounded-2xl border border-border bg-surface-1 px-4 py-6 text-center text-[15px] text-ink-muted">
          {brain.loading ? 'Loading…' : 'This task doesn’t exist any more.'}
        </p>
      </>
    )
  }

  const saveTitle = () => {
    const next = title.trim()
    if (!next) setTitle(task.title)
    else if (next !== task.title) void brain.updateTask(task, { title: next })
  }

  const due = describeDue(task.due_date, task.done)

  return (
    <>
      {back}

      <section className="flex items-start gap-3 rounded-2xl border border-border bg-surface-1 px-4 py-3">
        <div className="pt-2.5">
          <CheckCircle
            checked={task.done}
            onToggle={() => brain.toggleTask(task)}
            label={task.done ? 'Mark as not done' : 'Mark as done'}
          />
        </div>
        <label htmlFor="task-title" className="sr-only">
          Task
        </label>
        <textarea
          id="task-title"
          value={title}
          rows={Math.min(4, Math.max(1, Math.ceil(title.length / 30)))}
          onChange={(e) => setTitle(e.target.value.replace(/\n/g, ''))}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
          className={cn(
            'min-w-0 flex-1 resize-none bg-transparent py-2 text-[20px] leading-snug font-bold focus:outline-none',
            task.done ? 'text-ink-muted line-through' : 'text-ink',
          )}
        />
      </section>

      <SectionLabel>Due date</SectionLabel>
      <section className="rounded-2xl border border-border bg-surface-1 p-4">
        <div className="flex items-center gap-3">
          <CalendarDays size={20} className={due?.overdue ? 'text-critical' : 'text-accent'} aria-hidden="true" />
          <p className={cn('flex-1 text-[16px] font-semibold', due?.overdue ? 'text-critical' : 'text-ink')}>
            {due ? due.label : 'No due date'}
          </p>
          {task.due_date && (
            <button
              type="button"
              onClick={() => brain.updateTask(task, { due_date: null })}
              className="-mr-2 flex h-11 items-center gap-1 rounded-full px-3 text-[14px] font-semibold text-ink-muted hover:text-ink"
            >
              <X size={15} aria-hidden="true" />
              Clear
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {quickDates().map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => brain.updateTask(task, { due_date: q.value })}
              aria-pressed={task.due_date === q.value}
              className={cn(
                'h-10 rounded-full border px-4 text-[14px] font-semibold transition-colors',
                task.due_date === q.value
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-border bg-surface-0 text-ink hover:border-accent',
              )}
            >
              {q.label}
            </button>
          ))}
          <label className="relative flex h-10 cursor-pointer items-center rounded-full border border-border bg-surface-0 px-4 text-[14px] font-semibold text-ink hover:border-accent">
            Pick a date…
            {/* The native picker (a wheel on iPhone) sits invisibly over the chip. */}
            <input
              type="date"
              value={task.due_date ?? ''}
              onChange={(e) => brain.updateTask(task, { due_date: e.target.value || null })}
              aria-label="Pick a due date"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
      </section>

      <SectionLabel>Priority</SectionLabel>
      <div role="radiogroup" aria-label="Priority" className="flex gap-1 rounded-xl bg-surface-2 p-1">
        {PRIORITIES.map((p) => {
          const on = task.priority === p.value
          return (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => brain.updateTask(task, { priority: p.value })}
              className={cn(
                'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-[14px] font-semibold transition-colors',
                on ? 'bg-surface-1 shadow-sm' : 'text-ink-muted hover:text-ink',
                on && (p.value === 'none' || p.value === 'low' ? 'text-ink' : priorityTone[p.value]),
              )}
            >
              {p.value !== 'none' && <Flag size={14} className={on ? 'fill-current' : ''} aria-hidden="true" />}
              {p.label}
            </button>
          )
        })}
      </div>

      <p className="mt-2 px-4 text-[13px] text-ink-muted">Changes save as you make them.</p>

      <div className="mt-8">
        {confirmDelete ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                void brain.removeTask(task)
                window.location.hash = href.today
              }}
              className="h-11 flex-1 rounded-xl bg-critical px-3 text-[15px] font-semibold text-accent-ink"
            >
              Delete this task
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
            Delete task
          </button>
        )}
      </div>
    </>
  )
}

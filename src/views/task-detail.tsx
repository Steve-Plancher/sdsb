import { CalendarDays, Check, ChevronLeft, Clock, Flag, Repeat, StickyNote, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SectionLabel } from '@/components/layout/app-shell'
import { CheckCircle } from '@/components/ui/check-circle'
import type { Brain } from '@/hooks/use-brain'
import { href } from '@/lib/router'
import { describeDue, formatTime, PRIORITIES, priorityTone, quickDates } from '@/lib/tasks'
import { formatNext, nextDue, REPEAT_UNITS, repeats, type RepeatUnit } from '@/lib/recurrence'
import { today } from '@/lib/dates'

const NOTE_LIMIT = 150
import { cn } from '@/lib/utils'

export function TaskDetailView({ brain, taskId }: { brain: Brain; taskId: number }) {
  const task = brain.tasks.find((t) => t.id === taskId)
  const [title, setTitle] = useState(task?.title ?? '')
  const [note, setNote] = useState(task?.notes ?? '')
  const [noteOpen, setNoteOpen] = useState(!!task?.notes)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Pick up the title once the task list has loaded (deep link / refresh).
  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setNote(task.notes)
    setNoteOpen(!!task.notes)
  }, [task?.id])

  // Save a rename shortly after typing stops, not only on blur: a swipe-back
  // gesture can leave the screen without the field ever losing focus.
  const latest = useRef({ task, title, note, brain })
  latest.current = { task, title, note, brain }
  useEffect(() => {
    const timer = window.setTimeout(flushEdits, 700)
    return () => window.clearTimeout(timer)
  }, [title, note])
  // …and flush whatever is pending when the screen goes away.
  useEffect(() => () => flushEdits(), [])

  function flushEdits() {
    const { task: t, title: typed, note: noted, brain: b } = latest.current
    if (!t) return
    const patch: { title?: string; notes?: string } = {}
    const nextTitle = typed.trim()
    if (nextTitle && nextTitle !== t.title) patch.title = nextTitle
    const nextNote = noted.slice(0, NOTE_LIMIT)
    if (nextNote !== t.notes) patch.notes = nextNote
    if (Object.keys(patch).length) void b.updateTask(t, patch)
  }

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
    if (!title.trim()) setTitle(task.title)
    else flushEdits()
  }

  const due = describeDue(task.due_date, task.due_time, task.done)
  const repeating = repeats(task)
  const nextPreview = nextDue(
    task.due_date ?? today(),
    task.due_time,
    task.repeat_every ?? 1,
    task.repeat_unit ?? 'day',
  )

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
              onClick={() => brain.updateTask(task, { due_date: null, due_time: null })}
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
              onChange={(e) =>
                brain.updateTask(task, e.target.value ? { due_date: e.target.value } : { due_date: null, due_time: null })
              }
              aria-label="Pick a due date"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>

        {task.due_date && (
          <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
            <Clock size={20} className="text-accent" aria-hidden="true" />
            <label htmlFor="due-time" className="flex-1 text-[16px] font-semibold text-ink">
              {task.due_time ? formatTime(task.due_time) : 'Any time that day'}
            </label>
            <span className="relative flex h-10 items-center rounded-full border border-border bg-surface-0 px-4 text-[14px] font-semibold text-ink hover:border-accent">
              {task.due_time ? 'Change' : 'Add a time'}
              <input
                id="due-time"
                type="time"
                value={task.due_time?.slice(0, 5) ?? ''}
                onChange={(e) => brain.updateTask(task, { due_time: e.target.value ? `${e.target.value}:00` : null })}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </span>
            {task.due_time && (
              <button
                type="button"
                onClick={() => brain.updateTask(task, { due_time: null })}
                aria-label="Remove the time"
                className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:text-ink"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </section>

      <SectionLabel>Note</SectionLabel>
      <section className="rounded-2xl border border-border bg-surface-1 p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <StickyNote size={20} className={noteOpen ? 'text-accent' : 'text-ink-muted'} aria-hidden="true" />
          <span className="flex-1 text-[16px] font-semibold text-ink">Add a note</span>
          <input
            type="checkbox"
            checked={noteOpen}
            onChange={(e) => {
              if (e.target.checked) {
                setNoteOpen(true)
                return
              }
              // Closing clears the note, with a way back.
              const previous = task.notes
              setNoteOpen(false)
              setNote('')
              void brain.updateTask(task, { notes: '' })
              if (previous) {
                brain.showToast('Note removed', () => {
                  setNote(previous)
                  setNoteOpen(true)
                  void brain.updateTask(task, { notes: previous })
                  brain.dismissToast()
                })
              }
            }}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md border-[1.5px] border-border-strong text-accent-ink transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60"
          >
            {noteOpen && <Check size={15} strokeWidth={3} />}
          </span>
        </label>

        {noteOpen && (
          <>
            <label htmlFor="task-note" className="sr-only">
              Note
            </label>
            <textarea
              id="task-note"
              value={note}
              maxLength={NOTE_LIMIT}
              rows={3}
              placeholder="Anything worth remembering about this task…"
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_LIMIT))}
              onBlur={flushEdits}
              className="mt-3 w-full resize-none rounded-xl border border-border bg-surface-0 px-3.5 py-2.5 text-[16px] leading-snug text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
            />
            <p className={cn('mt-1 text-right text-[13px]', note.length >= NOTE_LIMIT ? 'text-warning' : 'text-ink-muted')}>
              {note.length}/{NOTE_LIMIT}
            </p>
          </>
        )}
      </section>

      <SectionLabel>Repeat</SectionLabel>
      <section className="rounded-2xl border border-border bg-surface-1 p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <Repeat size={20} className={repeating ? 'text-accent' : 'text-ink-muted'} aria-hidden="true" />
          <span className="flex-1 text-[16px] font-semibold text-ink">Repeats</span>
          <input
            type="checkbox"
            checked={repeating}
            onChange={(e) =>
              brain.updateTask(
                task,
                e.target.checked
                  ? {
                      repeat_every: 1,
                      repeat_unit: 'day',
                      // A repeat needs something to count from.
                      ...(task.due_date ? {} : { due_date: today() }),
                    }
                  : { repeat_every: null, repeat_unit: null },
              )
            }
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md border-[1.5px] border-border-strong text-accent-ink transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60"
          >
            {repeating && <Check size={15} strokeWidth={3} />}
          </span>
        </label>

        {repeating && (
          <>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[16px] text-ink">Every</span>
              <label htmlFor="repeat-every" className="sr-only">
                Repeat interval
              </label>
              <input
                id="repeat-every"
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                value={task.repeat_every ?? 1}
                onChange={(e) => {
                  const n = Math.min(365, Math.max(1, Math.round(Number(e.target.value) || 1)))
                  void brain.updateTask(task, { repeat_every: n })
                }}
                className="h-11 w-20 rounded-xl border border-border bg-surface-0 px-3 text-center text-[16px] font-semibold text-ink tabular-nums focus:border-accent focus:outline-none"
              />
              <label htmlFor="repeat-unit" className="sr-only">
                Repeat unit
              </label>
              <select
                id="repeat-unit"
                value={task.repeat_unit ?? 'day'}
                onChange={(e) => {
                  const unit = e.target.value as RepeatUnit
                  // An hourly repeat needs a time of day to count from.
                  const needsTime = unit === 'hour' && !task.due_time
                  const now = new Date()
                  void brain.updateTask(task, {
                    repeat_unit: unit,
                    ...(needsTime
                      ? { due_time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00` }
                      : {}),
                  })
                }}
                className="h-11 flex-1 rounded-xl border border-border bg-surface-0 px-3 text-[16px] font-semibold text-ink focus:border-accent focus:outline-none"
              >
                {REPEAT_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {(task.repeat_every ?? 1) === 1 ? u.one : u.many}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-[13px] text-ink-muted">
              Ticking it off moves it to {formatNext(nextPreview)} — it never sits here ticked.
            </p>
          </>
        )}
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

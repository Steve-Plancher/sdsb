import { CalendarDays, Flag, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle } from '@/components/ui/check-circle'
import type { Task } from '@/lib/api'
import { href } from '@/lib/router'
import { describeDue, priorityLabel, priorityTone } from '@/lib/tasks'
import { cn } from '@/lib/utils'

/** The one-line summary under a task: due date and priority, only when set. */
function TaskMeta({ task }: { task: Task }) {
  const due = describeDue(task.due_date, task.due_time, task.done)
  const hasPriority = task.priority !== 'none'
  if (!due && !hasPriority) return null
  return (
    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] font-semibold">
      {due && (
        <span className={cn('inline-flex items-center gap-1', due.overdue ? 'text-critical' : due.soon ? 'text-accent' : 'text-ink-muted')}>
          <CalendarDays size={13} aria-hidden="true" />
          {due.overdue || due.label.startsWith('Today') || due.label.startsWith('Tomorrow') ? due.label : `Due ${due.label}`}
        </span>
      )}
      {hasPriority && (
        <span className={cn('inline-flex items-center gap-1', task.done ? 'text-ink-muted' : priorityTone[task.priority])}>
          <Flag size={13} className="fill-current" aria-hidden="true" />
          {priorityLabel(task.priority)}
        </span>
      )}
    </span>
  )
}

type Props = {
  tasks: Task[]
  onAdd: (title: string) => void
  onToggle: (task: Task) => void
  onRemove: (task: Task) => void
}

export function TaskList({ tasks, onAdd, onToggle, onRemove }: Props) {
  const [draft, setDraft] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    onAdd(draft.trim())
    setDraft('')
  }

  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2 p-3">
        <label htmlFor="new-task" className="sr-only">
          New task
        </label>
        <input
          id="new-task"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What needs doing today?"
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface-0 px-3.5 text-[16px] text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
        />
        <Button type="submit" variant="primary" className="h-11 px-4 text-[15px]" disabled={!draft.trim()}>
          <Plus size={17} aria-hidden="true" />
          Add
        </Button>
      </form>

      {tasks.length === 0 ? (
        <p className="border-t border-border px-4 py-5 text-center text-[15px] text-ink-muted">
          Nothing yet. Add your first task above.
        </p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {[...open, ...done].map((task) => (
            <li key={task.id} className="group flex min-h-[52px] items-center gap-3 px-4">
              <CheckCircle
                checked={task.done}
                onToggle={() => onToggle(task)}
                label={task.done ? `Mark “${task.title}” as not done` : `Mark “${task.title}” as done`}
              />
              <a href={href.task(task.id)} className="min-w-0 flex-1 py-3">
                <span
                  className={cn(
                    'block text-[16px] leading-snug break-words',
                    task.done ? 'text-ink-muted line-through' : 'text-ink',
                  )}
                >
                  {task.title}
                </span>
                <TaskMeta task={task} />
              </a>
              <button
                type="button"
                onClick={() => onRemove(task)}
                aria-label={`Delete “${task.title}”`}
                className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:text-critical sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <Trash2 size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

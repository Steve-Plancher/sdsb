import { Check, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Task } from '@/lib/api'
import { cn } from '@/lib/utils'

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
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What needs doing today?"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface-0 px-3 text-[16px] text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none sm:text-[13px]"
        />
        <Button type="submit" variant="primary" size="md" disabled={!draft.trim()}>
          <Plus size={15} />
          Add
        </Button>
      </form>

      <ul className="mt-3 space-y-0.5">
        {[...open, ...done].map((task) => (
          <li
            key={task.id}
            className="group flex items-center gap-2.5 rounded-lg px-1.5 py-2 hover:bg-surface-2 sm:py-1.5"
          >
            <button
              type="button"
              onClick={() => onToggle(task)}
              aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
              className={cn(
                'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors',
                task.done
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-border-strong hover:border-accent',
              )}
            >
              {Boolean(task.done) && <Check size={12} strokeWidth={3} />}
            </button>

            <span
              className={cn(
                'min-w-0 flex-1 text-[14px] leading-snug sm:text-[13px]',
                task.done ? 'text-ink-muted line-through' : 'text-ink',
              )}
            >
              {task.title}
            </span>

            <Button
              size="icon"
              onClick={() => onRemove(task)}
              aria-label="Delete task"
              className="shrink-0 hover:text-critical sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </Button>
          </li>
        ))}

        {tasks.length === 0 && (
          <li className="px-1.5 py-6 text-center text-[13px] text-ink-muted">
            Nothing yet. Add your first task above.
          </li>
        )}
      </ul>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type Habit, type HabitEntry, type Task } from '@/lib/api'
import type { DayKey } from '@/lib/dates'
import { describeNext, nextDue, repeats } from '@/lib/recurrence'

export type Toast = { id: number; message: string; undo?: () => void }

/** The task's due moment as an instant, for the completion record. */
const dueAtIso = (task: Task) =>
  task.due_date ? new Date(`${task.due_date}T${task.due_time ?? '00:00:00'}`).toISOString() : null

export function useBrain() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<HabitEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = useCallback((message: string, undo?: () => void) => setToast({ id: Date.now(), message, undo }), [])

  const refresh = useCallback(async () => {
    try {
      const [t, h, e] = await Promise.all([api.tasks.list(), api.habits.list(), api.entries.list()])
      setTasks(t)
      setHabits(h)
      setEntries(e)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /** Run a write; if it fails, surface the error and resync from the server. */
  const attempt = useCallback(
    async (write: () => Promise<unknown>) => {
      try {
        await write()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save that change')
        await refresh()
      }
    },
    [refresh],
  )

  /* ------------------------------- derived ------------------------------- */

  const entriesByHabit = useMemo(() => {
    const map = new Map<number, Set<DayKey>>()
    for (const e of entries) {
      if (!map.has(e.habit_id)) map.set(e.habit_id, new Set())
      map.get(e.habit_id)!.add(e.date)
    }
    return map
  }, [entries])

  const countsByDay = useMemo(() => {
    const map = new Map<DayKey, number>()
    for (const e of entries) map.set(e.date, (map.get(e.date) ?? 0) + 1)
    return map
  }, [entries])

  /* ------------------------------ mutations ------------------------------ */

  const addTask = useCallback(
    (title: string) =>
      attempt(async () => {
        const created = await api.tasks.create(title)
        setTasks((prev) => [created, ...prev])
      }),
    [attempt],
  )

  /**
   * Ticking a task off. A repeating task never stays ticked: it records the
   * completion and moves to its next occurrence, with an Undo.
   */
  const toggleTask = useCallback(
    (task: Task) =>
      attempt(async () => {
        if (task.done) {
          setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: false } : t)))
          const saved = await api.tasks.update(task.id, { done: false })
          setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)))
          await api.completions.removeLatestFor(task.id)
          return
        }

        const completion = await api.completions.create({
          task_id: task.id,
          title: task.title,
          due_at: dueAtIso(task),
          was_recurring: repeats(task),
        })

        if (repeats(task) && task.due_date) {
          const next = nextDue(task.due_date, task.due_time, task.repeat_every!, task.repeat_unit!)
          setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...next } : t)))
          const saved = await api.tasks.update(task.id, next)
          setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)))
          showToast(`Done — ${describeNext(next)}`, () =>
            void attempt(async () => {
              const back = { due_date: task.due_date, due_time: task.due_time }
              setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...back } : t)))
              await api.tasks.update(task.id, back)
              await api.completions.remove(completion.id)
              setToast(null)
            }),
          )
          return
        }

        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: true } : t)))
        const saved = await api.tasks.update(task.id, { done: true })
        setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)))
        showToast('Done', () =>
          void attempt(async () => {
            setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: false } : t)))
            await api.tasks.update(task.id, { done: false })
            await api.completions.remove(completion.id)
            setToast(null)
          }),
        )
      }),
    [attempt, showToast],
  )

  const updateTask = useCallback(
    (task: Task, patch: Partial<Pick<Task, 'title' | 'notes' | 'due_date' | 'due_time' | 'priority' | 'repeat_every' | 'repeat_unit'>>) =>
      attempt(async () => {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...patch } : t)))
        const saved = await api.tasks.update(task.id, patch)
        setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)))
      }),
    [attempt],
  )

  const removeTask = useCallback(
    (task: Task) =>
      attempt(async () => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id))
        await api.tasks.remove(task.id)
      }),
    [attempt],
  )

  const addHabit = useCallback(
    (name: string) =>
      attempt(async () => {
        const created = await api.habits.create(name)
        setHabits((prev) => [...prev, created])
      }),
    [attempt],
  )

  const toggleEntry = useCallback(
    (habitId: number, date: DayKey) =>
      attempt(async () => {
        const on = !entries.some((e) => e.habit_id === habitId && e.date === date)
        // Optimistic, so ticking a box feels instant; the server is the tiebreak.
        setEntries((prev) =>
          on
            ? [...prev, { id: -Date.now(), habit_id: habitId, date }]
            : prev.filter((e) => !(e.habit_id === habitId && e.date === date)),
        )
        await api.entries.toggle(habitId, date, on)
      }),
    [attempt, entries],
  )

  const removeHabit = useCallback(
    (habit: Habit) =>
      attempt(async () => {
        setHabits((prev) => prev.filter((h) => h.id !== habit.id))
        setEntries((prev) => prev.filter((e) => e.habit_id !== habit.id))
        await api.habits.remove(habit.id)
      }),
    [attempt],
  )

  return {
    tasks,
    habits,
    entries,
    entriesByHabit,
    countsByDay,
    loading,
    error,
    dismissError: () => setError(null),
    toast,
    showToast,
    dismissToast: () => setToast(null),
    addTask,
    toggleTask,
    updateTask,
    removeTask,
    addHabit,
    toggleEntry,
    removeHabit,
  }
}

export type Brain = ReturnType<typeof useBrain>

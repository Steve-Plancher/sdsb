import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type Habit, type HabitEntry, type Task } from '@/lib/api'
import type { DayKey } from '@/lib/dates'

export function useBrain() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<HabitEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const toggleTask = useCallback(
    (task: Task) =>
      attempt(async () => {
        const next = !task.done
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: next } : t)))
        const saved = await api.tasks.update(task.id, { done: next })
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
    addTask,
    toggleTask,
    removeTask,
    addHabit,
    toggleEntry,
    removeHabit,
  }
}

import { supabase } from '@/lib/supabase'

export type Task = {
  id: number
  title: string
  notes: string
  done: boolean
  priority: 'none' | 'low' | 'med' | 'high'
  due_date: string | null
  created_at: string
  completed_at: string | null
  sort_order: number
}

export type Habit = {
  id: number
  name: string
  color: string
  target_per_week: number
  archived: boolean
  created_at: string
  sort_order: number
}

export type HabitEntry = {
  id: number
  habit_id: number
  date: string
}

/** Unwrap a Supabase response, turning its error into a thrown one. */
function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

// user_id is filled by the database (default auth.uid()) and enforced by RLS,
// so none of these calls pass it.
export const api = {
  tasks: {
    list: async () =>
      must(
        await supabase
          .from('tasks')
          .select('*')
          .order('done')
          .order('sort_order')
          .order('id', { ascending: false }),
      ) as Task[],
    create: async (title: string) =>
      must(await supabase.from('tasks').insert({ title }).select().single()) as Task,
    update: async (id: number, patch: Partial<Pick<Task, 'title' | 'notes' | 'done' | 'priority' | 'due_date' | 'sort_order'>>) =>
      must(await supabase.from('tasks').update(patch).eq('id', id).select().single()) as Task,
    remove: async (id: number) => {
      must(await supabase.from('tasks').delete().eq('id', id))
    },
  },
  habits: {
    list: async () =>
      must(
        await supabase
          .from('habits')
          .select('*')
          .eq('archived', false)
          .order('sort_order')
          .order('id'),
      ) as Habit[],
    create: async (name: string) =>
      must(await supabase.from('habits').insert({ name }).select().single()) as Habit,
    remove: async (id: number) => {
      must(await supabase.from('habits').delete().eq('id', id))
    },
  },
  entries: {
    list: async () =>
      must(await supabase.from('habit_entries').select('id, habit_id, date').order('date')) as HabitEntry[],
    /** Ticking is a toggle: the same call sets and clears a day. */
    toggle: async (habitId: number, date: string, on: boolean) => {
      if (on) {
        must(
          await supabase
            .from('habit_entries')
            .upsert({ habit_id: habitId, date }, { onConflict: 'habit_id,date', ignoreDuplicates: true }),
        )
      } else {
        must(await supabase.from('habit_entries').delete().eq('habit_id', habitId).eq('date', date))
      }
    },
  },
}

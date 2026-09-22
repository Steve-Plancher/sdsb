import { supabase } from '@/lib/supabase'

export type Task = {
  id: number
  title: string
  notes: string
  done: boolean
  priority: 'none' | 'low' | 'med' | 'high'
  due_date: string | null
  /** 'HH:MM:SS' local time, or null for an all-day task. */
  due_time: string | null
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

/** Minutes before the due moment. The database only accepts these values. */
export const REMINDER_OFFSETS = [30, 60, 180, 1440, 2880, 7200] as const
export type ReminderOffset = (typeof REMINDER_OFFSETS)[number]

export type UserSettings = {
  reminder_offsets: ReminderOffset[]
  /** 'HH:MM:SS' used for reminders on tasks that have a date but no time. */
  default_due_time: string
  timezone: string
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
    update: async (id: number, patch: Partial<Pick<Task, 'title' | 'notes' | 'done' | 'priority' | 'due_date' | 'due_time' | 'sort_order'>>) =>
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
  settings: {
    /** The row is created on first use, so a missing one just means defaults. */
    get: async () =>
      must(
        await supabase.from('user_settings').select('reminder_offsets, default_due_time, timezone').maybeSingle(),
      ) as UserSettings | null,
    save: async (patch: Partial<UserSettings>) =>
      must(
        await supabase
          .from('user_settings')
          .upsert({ ...patch, updated_at: new Date().toISOString() })
          .select('reminder_offsets, default_due_time, timezone')
          .single(),
      ) as UserSettings,
  },
  push: {
    save: async (sub: { endpoint: string; p256dh: string; auth: string; user_agent: string }) => {
      // Re-enabling on the same device refreshes its keys instead of duplicating it.
      must(await supabase.from('push_subscriptions').upsert(sub, { onConflict: 'endpoint' }))
    },
    remove: async (endpoint: string) => {
      must(await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint))
    },
    devices: async () => {
      const { count, error } = await supabase.from('push_subscriptions').select('id', { count: 'exact', head: true })
      if (error) throw new Error(error.message)
      return count ?? 0
    },
  },
}

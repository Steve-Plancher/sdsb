-- SDSB initial schema: tasks, habits and daily habit check-ins.
-- Every row belongs to one user, and row-level security makes that the only
-- user who can see or change it.

create table public.tasks (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null check (length(trim(title)) > 0),
  notes        text not null default '',
  done         boolean not null default false,
  priority     text not null default 'none' check (priority in ('none', 'low', 'med', 'high')),
  due_date     date,
  created_at   timestamptz not null default now(),
  completed_at timestamptz,
  sort_order   integer not null default 0
);

create table public.habits (
  id              bigint generated always as identity primary key,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text not null check (length(trim(name)) > 0),
  color           text not null default 'brand',
  target_per_week integer not null default 7 check (target_per_week between 1 and 7),
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  sort_order      integer not null default 0
);

-- A check-in is a (habit, day) pair. Days are the user's local calendar date,
-- sent by the client, so streaks never drift across timezones.
create table public.habit_entries (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id   bigint not null references public.habits (id) on delete cascade,
  date       date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

create index tasks_user_idx          on public.tasks (user_id, done);
create index habits_user_idx         on public.habits (user_id) where not archived;
create index habit_entries_user_idx  on public.habit_entries (user_id, date);
create index habit_entries_habit_idx on public.habit_entries (habit_id);

-- Stamp completion time on the server so throughput charts can trust it.
create function public.stamp_task_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.done is distinct from old.done then
    new.completed_at := case when new.done then now() else null end;
  end if;
  return new;
end;
$$;

create trigger tasks_stamp_completion
  before update of done on public.tasks
  for each row execute function public.stamp_task_completion();

-- A check-in may only point at one of the caller's own habits.
create function public.entry_habit_is_own(p_habit_id bigint)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.habits h
    where h.id = p_habit_id and h.user_id = (select auth.uid())
  );
$$;

alter table public.tasks         enable row level security;
alter table public.habits        enable row level security;
alter table public.habit_entries enable row level security;

create policy "own tasks"
  on public.tasks for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own habits"
  on public.habits for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own habit entries"
  on public.habit_entries for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.entry_habit_is_own(habit_id));

-- Signed-out visitors get nothing at all, not even an empty result set.
revoke all on public.tasks, public.habits, public.habit_entries from anon;

-- Task notes (capped at 150 characters), repeating tasks, and a record of
-- every completion so a repeating task's history survives rolling forward.

alter table public.tasks
  add column repeat_every integer,
  add column repeat_unit  text,
  add constraint tasks_notes_length check (length(notes) <= 150),
  add constraint tasks_repeat_unit_valid check (repeat_unit in ('hour', 'day', 'week', 'month')),
  add constraint tasks_repeat_pair check ((repeat_every is null) = (repeat_unit is null)),
  add constraint tasks_repeat_every_range check (repeat_every is null or repeat_every between 1 and 365);

-- One row per completion. title is a snapshot, and task_id goes null rather
-- than cascading, so deleting a task doesn't erase what you already did.
create table public.task_completions (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id       bigint references public.tasks (id) on delete set null,
  title         text not null,
  due_at        timestamptz,
  was_recurring boolean not null default false,
  completed_at  timestamptz not null default now()
);

create index task_completions_user_idx on public.task_completions (user_id, completed_at desc);

alter table public.task_completions enable row level security;

create policy "own task completions"
  on public.task_completions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.task_completions from anon;

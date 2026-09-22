-- Task due times, per-user settings, Web Push subscriptions and reminder
-- delivery. Reminders are sent by the send-reminders Edge Function, which
-- pg_cron calls every minute.

alter table public.tasks add column due_time time;

-- One row per user. timezone is the browser's IANA zone, kept current by the
-- app, so a date-only task's "9:00 AM" means 9:00 where the user is.
create table public.user_settings (
  user_id          uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  reminder_offsets integer[] not null default '{60}'
                   check (reminder_offsets <@ array[30, 60, 180, 1440, 2880, 7200]),
  default_due_time time not null default '09:00',
  timezone         text not null default 'UTC',
  updated_at       timestamptz not null default now()
);

-- A browser/device that agreed to receive notifications.
create table public.push_subscriptions (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- What has been sent, so each reminder fires once. due_at is part of the key,
-- so moving a task's due date re-arms its reminders.
create table public.reminder_log (
  task_id        bigint not null references public.tasks (id) on delete cascade,
  offset_minutes integer not null,
  due_at         timestamptz not null,
  sent_at        timestamptz not null default now(),
  primary key (task_id, offset_minutes, due_at)
);

alter table public.user_settings      enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reminder_log       enable row level security;

create policy "own settings"
  on public.user_settings for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own push subscriptions"
  on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- reminder_log is server-only: no policies, so clients can't read or write it.
revoke all on public.user_settings, public.push_subscriptions, public.reminder_log from anon;
revoke all on public.reminder_log from authenticated;

-- Reminders whose moment has arrived. A reminder is only sent within 15
-- minutes of its moment and before the task is due, so turning reminders on
-- (or adding a task due soon) never floods you with stale ones.
create function public.due_reminders()
returns table (
  task_id        bigint,
  user_id        uuid,
  title          text,
  due_at         timestamptz,
  offset_minutes integer,
  has_time       boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.user_id, t.title, d.due_at, o.offset_minutes, t.due_time is not null
  from public.tasks t
  join public.user_settings s on s.user_id = t.user_id
  cross join lateral (
    select ((t.due_date + coalesce(t.due_time, s.default_due_time)) at time zone s.timezone) as due_at
  ) d
  cross join lateral unnest(s.reminder_offsets) as o(offset_minutes)
  where not t.done
    and t.due_date is not null
    and now() >= d.due_at - make_interval(mins => o.offset_minutes)
    and now() <  d.due_at - make_interval(mins => o.offset_minutes) + interval '15 minutes'
    and now() <  d.due_at
    and not exists (
      select 1 from public.reminder_log l
      where l.task_id = t.id and l.offset_minutes = o.offset_minutes and l.due_at = d.due_at
    );
$$;

revoke execute on function public.due_reminders() from public, anon, authenticated;

# SDSB — Steve Digital Second Brain

Personal daily todo list + habit tracker with graphs. Single user, built to be
extended continuously — treat every change as something that has to coexist
with months of real data already in the database.

Hosted on **Vercel** (auto-deploys from `main` on GitHub `Steve-Plancher/sdsb`,
private), data in **Supabase** project `sdsb` (ref `rvdqfdrscmziisbnkllo`,
ca-central-1). The same Supabase backend is meant to serve the future iOS app.

## Running it

```bash
cp .env.example .env.local   # then fill in the URL + publishable key
npm run dev                  # Vite on :5173, talking to the hosted Supabase
```

There is no local database. Dev and production share the one Supabase project,
so local testing touches real data.

## Shape

Three tabs, matching the iOS mockups: **Today** (progress ring, tasks — tap one to edit its title, due date and priority — today’s
habit checks), **Habits** (7-day rows; tap → per-habit detail with streak,
stats and a tickable month calendar) and **Insights** (Week/Month/Year trend,
consistency heatmap, highlights). Phones get a bottom tab bar; wider screens
get the tabs in the header.

```
supabase/migrations/   schema + RLS (the source of truth for the database)
src/lib/router.ts      hash routes: #/today #/tasks/<id> #/habits #/habits/<id> #/insights
src/lib/tasks.ts       due-date wording and priority labels, shared by list and detail
src/lib/supabase.ts    client + "remember this device" session storage
src/lib/api.ts         typed data calls; user_id comes from the DB default
src/lib/dates.ts       DayKey helpers, streaks, month grid, weekday totals
src/hooks/             use-auth, use-brain (data + mutations), use-theme
src/views/             one file per screen
src/components/        auth/, brand/, layout/ (shell, titles), dashboard/, ui/
branding/v1/final/     Growth Rings brand pack (tokens JSON is the reference)
```

Hash routes need no Vercel rewrites and keep the phone's back gesture working.

## Security model

- Every table has `user_id default auth.uid()` and row-level security limiting
  each row to its owner. `anon` has no table privileges at all.
- Public sign-ups are **disabled** on the Supabase project. Steve's account was
  created via the admin API. Sign-in is **password** (min length 10, enforced
  server-side) or an **email magic link** (`shouldCreateUser: false`).
- Supabase's built-in mailer sends only **2 emails/hour** — that's why the
  password option exists. Raising it needs custom SMTP.
- "Remember this device" (`src/lib/supabase.ts`) picks the session store:
  localStorage when ticked (default), sessionStorage when not. Sessions never
  expire server-side (`sessions_timebox` and inactivity timeout are 0).
- The secret/service key never goes in this repo or in Vercel env.

## Applying migrations

Steve's home network blocks the Postgres protocol (TCP opens, the handshake
stalls), so `supabase db push` and `supabase db query --linked` time out there.
Apply SQL through the Management API (`POST /v1/projects/<ref>/database/query`)
and record the version in `supabase_migrations.schema_migrations` so a later
`db push` from another network doesn't re-run it.

## Reminders (Web Push)

- Settings (`#/settings`, gear top-right) holds Appearance, Notifications,
  reminder offsets (30 min, 1 h, 3 h, 1/2/5 days), the default time for
  date-only tasks, and Sign out. Stored in `user_settings` (one row per user,
  with the browser's IANA timezone kept current by `use-settings`).
- Each device that turns notifications on is a row in `push_subscriptions`.
  iPhone only allows this when SDSB is opened from the Home Screen (iOS 16.4+).
- `pg_cron` job `sdsb-reminders` calls the `send-reminders` Edge Function every
  minute with a shared secret from Vault (`sdsb_cron_secret`). The function
  asks `due_reminders()` what's due, claims each one in `reminder_log` (so it
  sends once; `due_at` is in the key, so moving a due date re-arms it) and
  pushes via `npm:web-push`. Dead subscriptions (404/410) are deleted.
- A reminder only goes out within 15 minutes of its moment and before the
  task is due, so nothing stale is sent in a burst.
- VAPID keys and `CRON_SECRET` are Supabase function secrets; the public key is
  also `VITE_VAPID_PUBLIC_KEY` in Vercel. Deploy the function with
  `supabase functions deploy send-reminders --use-api --no-verify-jwt`.
- `public/sw.js` shows the push and opens `#/tasks/<id>` when it's tapped.

## Versioning

Every shipped change gets a version. `package.json` holds it; `vite.config.ts`
injects it into the build along with the commit and build time, and it shows at
the bottom of Settings (`src/lib/version.ts`).

After committing a change:

```bash
npm run release          # fix or small change   1.0.0 -> 1.0.1
npm run release minor    # new feature           1.0.1 -> 1.1.0
npm run release major    # big rework            1.1.0 -> 2.0.0
```

That bumps the version, tags the commit `vX.Y.Z`, pushes both, and publishes a
GitHub release listing the commits since the last one. Vercel deploys from the
push, so the number in Settings always matches what's live. The script refuses
to run with uncommitted changes or when main and origin/main differ.


## Conventions

- **Dates are `YYYY-MM-DD` local-time strings** (`DayKey`), never `Date` objects
  in state or over the wire. Timezone drift silently corrupts streaks.
- **Colors come from CSS custom properties** in `src/index.css` — never a hex in
  a component. Light and dark are both designed; `--seq-*` is the heatmap ramp
  and on dark its brightest step means "most".
- Streak **text** uses `--warning` (darker orange that passes 4.5:1); the flame
  icon may use `--streak-icon` (Pearl's brand orange).
- The logo is `components/brand/logo.tsx`, drawn in theme colors. The SVGs in
  the brand pack are wrong (rings upside-down); the PNG masters are correct.
- Recharts marks use `isAnimationActive={false}`.
- Mutations are optimistic in `use-brain.ts`; on failure the error banner shows
  and state resyncs from the server.

## Schema notes

- `habit_entries` has `UNIQUE(habit_id, date)`; ticking a day is an upsert,
  unticking a delete.
- `tasks.completed_at` is stamped by a trigger whenever `done` changes.
- Habits have `archived` in the schema; the UI currently hard-deletes.

## Notes and repeating tasks

- A task's note is capped at **150 characters**, enforced in the form and by a
  `check` constraint on `tasks.notes`.
- Repeat is `repeat_every` + `repeat_unit` (`hour|day|week|month`), so "every 15
  days" and "monthly on the 15th" both work. `src/lib/recurrence.ts` owns the
  maths: it always advances at least one interval (finishing early must not
  leave a task due again the same evening) and keeps stepping past missed
  occurrences. `addMonths` clamps (31 Jan + 1 month = 28 Feb).
  `npm run test:recurrence` runs the checks in `scripts/check-recurrence.ts`.
- A repeating task never sits ticked: `toggleTask` in `use-brain.ts` records a
  `task_completions` row and rolls `due_date`/`due_time` forward, with an Undo
  toast. Reminders re-arm by themselves, since `reminder_log` is keyed by
  `due_at`.
- Today's list shows open tasks plus anything finished **today** (so it can be
  seen and undone); older finished tasks drop off and live in the history.
  Tasks are never auto-deleted.
- `task_completions` keeps a title snapshot and sets `task_id` to null when the
  task is deleted, so history survives. Read-only at `#/settings/history`.

## Scope

The real target is a **native iOS app** (Expo + EAS, no Mac available). This web
app is the hosted version Steve uses meanwhile and the proving ground for the
data model.

Not built yet: per-habit detail views, weekly review, task due dates in the UI.

**Notes/linking is out of scope.** Despite the name, Steve dropped notes on
2026-09-19 — this is a todo and habit tracker. Don't re-propose it.

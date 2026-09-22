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

Three tabs, matching the iOS mockups: **Today** (progress ring, tasks, today's
habit checks), **Habits** (7-day rows; tap → per-habit detail with streak,
stats and a tickable month calendar) and **Insights** (Week/Month/Year trend,
consistency heatmap, highlights). Phones get a bottom tab bar; wider screens
get the tabs in the header.

```
supabase/migrations/   schema + RLS (the source of truth for the database)
src/lib/router.ts      hash routes: #/today #/habits #/habits/<id> #/insights
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

## Scope

The real target is a **native iOS app** (Expo + EAS, no Mac available). This web
app is the hosted version Steve uses meanwhile and the proving ground for the
data model.

Not built yet: per-habit detail views, weekly review, task due dates in the UI.

**Notes/linking is out of scope.** Despite the name, Steve dropped notes on
2026-09-19 — this is a todo and habit tracker. Don't re-propose it.

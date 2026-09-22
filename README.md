# SDSB — Steve Digital Second Brain

Daily tasks, habits and streaks, with a calm dashboard to see them build up.

React + TypeScript + Vite and Tailwind, with Supabase for sign-in and data and
Vercel for hosting. Set in Manrope, in the Growth Rings brand.

## Develop

```bash
npm install
cp .env.example .env.local   # Supabase URL + publishable key
npm run dev
```

## Database

The schema and row-level security policies live in `supabase/migrations/`.
Each row belongs to the signed-in user, and public sign-ups are disabled.

## Deploy

Pushing to `main` deploys to Vercel. The two `VITE_SUPABASE_*` variables are
set in the Vercel project.

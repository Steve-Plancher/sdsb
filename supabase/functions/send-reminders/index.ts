// SDSB task reminders over Web Push.
//
//   POST + x-cron-secret   (pg_cron, every minute) → send reminders now due
//   POST + Authorization   (signed-in user)        → send that user a test push
//
// Deployed with verify_jwt = false because the cron call carries a shared
// secret, not a user JWT; the test path verifies the user's token itself.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

webpush.setVapidDetails(
  'https://sdsb.vercel.app',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Payload = { title: string; body: string; url: string; tag: string }

function reminderTitle(offsetMinutes: number): string {
  switch (offsetMinutes) {
    case 30:
      return 'Due in 30 minutes'
    case 60:
      return 'Due in 1 hour'
    case 180:
      return 'Due in 3 hours'
    case 1440:
      return 'Due tomorrow'
    default:
      return offsetMinutes % 1440 === 0 ? `Due in ${offsetMinutes / 1440} days` : `Due in ${offsetMinutes} minutes`
  }
}

/** Push to every device the user enabled; forget devices the push service says are gone. */
async function pushToUser(userId: string, payload: Payload) {
  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)
  if (error) throw error

  let sent = 0
  let removed = 0
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60, urgency: 'high' },
      )
      sent++
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await admin.from('push_subscriptions').delete().eq('id', s.id)
        removed++
      } else {
        console.error('push failed', status, (err as Error).message)
      }
    }
  }
  return { devices: subs?.length ?? 0, sent, removed }
}

async function runReminders() {
  const { data: due, error } = await admin.rpc('due_reminders')
  if (error) throw error

  let delivered = 0
  for (const r of due ?? []) {
    // Claim the reminder first, so overlapping runs can never send it twice.
    const { data: claimed, error: claimError } = await admin
      .from('reminder_log')
      .upsert(
        { task_id: r.task_id, offset_minutes: r.offset_minutes, due_at: r.due_at },
        { onConflict: 'task_id,offset_minutes,due_at', ignoreDuplicates: true },
      )
      .select('task_id')
    if (claimError) throw claimError
    if (!claimed?.length) continue

    const result = await pushToUser(r.user_id, {
      title: reminderTitle(r.offset_minutes),
      body: r.title,
      url: `/#/tasks/${r.task_id}`,
      tag: `task-${r.task_id}`,
    })
    delivered += result.sent
  }
  return { due: due?.length ?? 0, delivered }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

  try {
    const cronSecret = req.headers.get('x-cron-secret')
    if (cronSecret !== null) {
      if (cronSecret !== Deno.env.get('CRON_SECRET')) return json({ error: 'forbidden' }, 403)
      return json(await runReminders())
    }

    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'sign in first' }, 401)
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) return json({ error: 'sign in first' }, 401)

    const result = await pushToUser(userData.user.id, {
      title: 'SDSB notifications are on',
      body: 'This is how a task reminder will look.',
      url: '/#/today',
      tag: 'sdsb-test',
    })
    return json(result)
  } catch (err) {
    console.error(err)
    return json({ error: (err as Error).message }, 500)
  }
})

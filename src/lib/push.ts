import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

/**
 * Why this device can or can't get notifications. iPhone only allows web push
 * for apps opened from the Home Screen (iOS 16.4+), never from a Safari tab.
 */
export type PushSupport = 'ok' | 'ios-needs-home-screen' | 'unsupported'

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export function pushSupport(): PushSupport {
  if (isIOS() && !isStandalone()) return 'ios-needs-home-screen'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || !VAPID_PUBLIC_KEY) {
    return 'unsupported'
  }
  return 'ok'
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('service worker failed', err))
  }
}

function keyBytes(base64url: string) {
  const b64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

/** This device's current subscription, if it has one. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== 'ok') return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

/** Ask permission (must run from a tap), subscribe, and remember this device. */
export async function enablePush(): Promise<'enabled' | 'denied'> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'

  const reg = await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY!) }))

  const json = sub.toJSON()
  await api.push.save({
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? '',
    user_agent: navigator.userAgent.slice(0, 200),
  })
  return 'enabled'
}

export async function disablePush() {
  const sub = await currentSubscription()
  if (!sub) return
  await api.push.remove(sub.endpoint)
  await sub.unsubscribe()
}

/** Ask the server to push a test notification to every device you've enabled. */
export async function sendTestPush(): Promise<{ devices: number; sent: number }> {
  const { data, error } = await supabase.functions.invoke('send-reminders', { body: { test: true } })
  if (error) throw new Error(error.message)
  return data as { devices: number; sent: number }
}

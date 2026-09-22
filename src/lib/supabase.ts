import { createClient, type SupportedStorage } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY — copy .env.example to .env.local',
  )
}

/* ------------------------- "Remember this device" ------------------------- */

const REMEMBER_KEY = 'sdsb-remember-device'

/** Remembered by default; only an explicit "no" keeps the session per-tab. */
export function remembersDevice(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== 'no'
  } catch {
    return false
  }
}

/**
 * Saved before the sign-in email is sent, so the choice still applies when the
 * link opens in a new tab.
 */
export function setRememberDevice(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? 'yes' : 'no')
  } catch {
    /* storage blocked — falls back to a per-tab session */
  }
}

// Remembered: the session lives in localStorage and survives closing the
// browser until you sign out. Not remembered: sessionStorage, so it ends when
// the tab closes — right for a shared computer.
const sessionStore: SupportedStorage = {
  getItem(k) {
    try {
      return sessionStorage.getItem(k) ?? localStorage.getItem(k)
    } catch {
      return null
    }
  },
  setItem(k, v) {
    try {
      if (remembersDevice()) {
        localStorage.setItem(k, v)
        sessionStorage.removeItem(k)
      } else {
        sessionStorage.setItem(k, v)
        localStorage.removeItem(k)
      }
    } catch {
      /* storage blocked — the session just won't persist */
    }
  },
  removeItem(k) {
    try {
      localStorage.removeItem(k)
      sessionStorage.removeItem(k)
    } catch {
      /* nothing to remove */
    }
  },
}

// The publishable key is meant to ship in the browser. What protects the data
// is row-level security in supabase/migrations, not this key.
export const supabase = createClient(url, key, {
  auth: {
    storage: sessionStore,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

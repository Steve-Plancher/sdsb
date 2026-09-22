import { AuthError } from '@supabase/supabase-js'
import { Check, Eye, EyeOff, Mail } from 'lucide-react'
import { useState } from 'react'
import { SdsbMark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { remembersDevice, setRememberDevice, supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Mode = 'password' | 'link'
type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'sent'; email: string }
  | { kind: 'error'; message: string }

const MODE_KEY = 'sdsb-signin-mode'

/** Turn Supabase's auth errors into something you can act on. */
function explain(error: AuthError, mode: Mode): string {
  if (error.code === 'invalid_credentials') return 'That email and password don’t match.'
  if (error.status === 429 || error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') {
    return mode === 'link'
      ? 'Too many sign-in emails were sent recently. Wait about an hour, or sign in with your password instead.'
      : 'Too many attempts. Wait a few minutes, then try again.'
  }
  if (error.code === 'otp_disabled' || error.message === 'Signups not allowed for otp') {
    return 'That email doesn’t have an SDSB account.'
  }
  return error.message
}

function initialMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === 'link' ? 'link' : 'password'
  } catch {
    return 'password'
  }
}

const field =
  'mt-1.5 h-11 w-full rounded-xl border border-border bg-surface-0 px-3.5 text-[16px] text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none'

export function SignIn() {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(remembersDevice)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  function switchMode(next: Mode) {
    setMode(next)
    setStatus({ kind: 'idle' })
    try {
      localStorage.setItem(MODE_KEY, next)
    } catch {
      /* not remembered — fine */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const address = email.trim()
    if (!address || (mode === 'password' && !password)) return
    setStatus({ kind: 'busy' })
    // Must be saved before the session is written, so it lands in the right store.
    setRememberDevice(remember)

    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email: address, password })
      // On success the auth listener swaps this screen for the dashboard.
      if (error) setStatus({ kind: 'error', message: explain(error, mode) })
      return
    }

    // Sign-ups are disabled on the project, so this only ever signs in an
    // existing account; anyone else gets an error and no email.
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    })
    setStatus(error ? { kind: 'error', message: explain(error, mode) } : { kind: 'sent', email: address })
  }

  const busy = status.kind === 'busy'
  const canSubmit = email.trim() !== '' && (mode === 'link' || password !== '') && !busy

  return (
    <div className="grid min-h-dvh place-items-center bg-surface-0 px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <main className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <SdsbMark size={64} />
          <h1 className="mt-5 text-[28px] leading-tight font-bold tracking-tight text-ink">SDSB</h1>
          <p className="mt-1 text-[15px] text-ink-secondary">Steve Digital Second Brain</p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-surface-1 p-5">
          {status.kind === 'sent' ? (
            <div className="text-center" role="status">
              <Mail className="mx-auto text-accent" size={28} aria-hidden="true" />
              <h2 className="mt-3 text-[17px] font-semibold text-ink">Check your email</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-secondary">
                We sent a sign-in link to <span className="font-semibold text-ink">{status.email}</span>. Open it on
                this device to continue. It can take a minute, and may land in Junk.
              </p>
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => setStatus({ kind: 'idle' })}>
                Back
              </Button>
            </div>
          ) : (
            <>
              <div role="tablist" aria-label="Sign-in method" className="mb-5 flex gap-1 rounded-xl bg-surface-2 p-1">
                {(
                  [
                    ['password', 'Password'],
                    ['link', 'Email link'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => switchMode(value)}
                    className={cn(
                      'h-9 flex-1 rounded-lg text-[14px] font-semibold transition-colors',
                      mode === value ? 'bg-surface-1 text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} noValidate>
                <label htmlFor="email" className="block text-[13px] font-semibold text-ink-secondary">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={field}
                  placeholder="you@example.com"
                />

                {mode === 'password' && (
                  <>
                    <label htmlFor="password" className="mt-4 block text-[13px] font-semibold text-ink-secondary">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn(field, 'pr-12')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute top-1.5 right-1.5 flex h-11 w-10 items-center justify-center text-ink-muted hover:text-ink"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </>
                )}

                <label className="mt-4 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-0 text-accent-ink transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60"
                  >
                    {remember && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">Remember this device</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">
                      Stay signed in until you sign out. Leave unticked on a shared computer.
                    </span>
                  </span>
                </label>

                {status.kind === 'error' && (
                  <p className="mt-3 text-[13px] leading-snug text-critical" role="alert">
                    {status.message}
                  </p>
                )}

                <Button type="submit" variant="primary" className="mt-4 h-11 w-full text-[15px]" disabled={!canSubmit}>
                  {mode === 'password'
                    ? busy
                      ? 'Signing in…'
                      : 'Sign in'
                    : busy
                      ? 'Sending…'
                      : 'Email me a sign-in link'}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

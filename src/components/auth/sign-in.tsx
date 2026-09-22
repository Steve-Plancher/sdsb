import { AuthError } from '@supabase/supabase-js'
import { Check, Mail } from 'lucide-react'
import { useState } from 'react'
import { SdsbMark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { remembersDevice, setRememberDevice, supabase } from '@/lib/supabase'

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; email: string } | { kind: 'error'; message: string }

/** Turn Supabase's auth errors into something you can act on. */
function explain(error: AuthError): string {
  if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
    return 'Too many sign-in emails were sent recently. Wait about an hour, then try again — your last link still works if it arrived.'
  }
  if (error.code === 'otp_disabled' || error.message === 'Signups not allowed for otp') {
    return 'That email doesn’t have an SDSB account.'
  }
  return error.message
}

export function SignIn() {
  const [email, setEmail] = useState('')
  const [remember, setRemember] = useState(remembersDevice)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const address = email.trim()
    if (!address) return
    setStatus({ kind: 'sending' })
    setRememberDevice(remember)

    // Sign-ups are disabled on the project, so this only ever signs in an
    // existing account; anyone else gets an error and no email.
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    })
    setStatus(error ? { kind: 'error', message: explain(error) } : { kind: 'sent', email: address })
  }

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
                this device to continue.
              </p>
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => setStatus({ kind: 'idle' })}>
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <label htmlFor="email" className="block text-[13px] font-semibold text-ink-secondary">
                Email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface-0 px-3.5 text-[16px] text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
                placeholder="you@example.com"
              />
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
              <Button
                type="submit"
                variant="primary"
                className="mt-4 h-11 w-full text-[15px]"
                disabled={!email.trim() || status.kind === 'sending'}
              >
                {status.kind === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

import { Check, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Round iOS-style completion toggle; the hit area is 44px even though the dot is 26px. */
export function CheckCircle({
  checked,
  onToggle,
  label,
}: {
  checked: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      aria-label={label}
      className="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <span
        className={cn(
          'flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] transition-colors',
          checked ? 'border-accent bg-accent text-accent-ink' : 'border-border-strong',
        )}
      >
        {checked && <Check size={15} strokeWidth={3} />}
      </span>
    </button>
  )
}

/** Flame + day count. Orange only while a streak is alive. */
export function StreakBadge({ days, className }: { days: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[14px] font-semibold tabular-nums',
        days > 0 ? 'text-warning' : 'text-ink-muted',
        className,
      )}
      title={`${days}-day streak`}
    >
      <Flame size={14} className={days > 0 ? 'fill-current' : ''} aria-hidden="true" />
      {days}
      <span className="sr-only"> day streak</span>
    </span>
  )
}

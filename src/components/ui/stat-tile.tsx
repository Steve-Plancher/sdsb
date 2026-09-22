import type { ReactNode } from 'react'

/**
 * A single number is a form in its own right - no plot, so no hover layer.
 * `footer` carries the comparison that gives the number meaning.
 */
export function StatTile({
  label,
  value,
  unit,
  footer,
  icon,
  tone = 'neutral',
}: {
  label: string
  value: string | number
  unit?: string
  footer?: string
  icon?: ReactNode
  tone?: 'neutral' | 'good' | 'accent'
}) {
  const valueColor =
    tone === 'good' ? 'text-good' : tone === 'accent' ? 'text-accent' : 'text-ink'

  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface-1 px-3.5 py-3 sm:px-4 sm:py-3.5">
      <div className="flex items-center gap-1.5 truncate text-[11px] font-medium tracking-wide text-ink-muted uppercase sm:text-[12px]">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={`text-[28px] leading-none font-semibold tabular-nums ${valueColor}`}>
          {value}
        </span>
        {unit && <span className="text-[13px] font-medium text-ink-muted">{unit}</span>}
      </div>
      {footer && <p className="mt-1.5 text-[12px] text-ink-muted">{footer}</p>}
    </div>
  )
}

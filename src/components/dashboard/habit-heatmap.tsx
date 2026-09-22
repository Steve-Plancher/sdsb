import { useMemo, useState } from 'react'
import { heatmapDays, prettyDay, type DayKey } from '@/lib/dates'

type Props = {
  /** How many habits were ticked on each day. */
  countsByDay: Map<DayKey, number>
  /** Denominator for the intensity ramp - the number of active habits. */
  total: number
  weeks?: number
}

const RAMP = ['var(--seq-0)', 'var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)']
const WEEKDAYS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']

/** Continuous magnitude -> one hue, light to dark. Never a rainbow. */
function rampStep(count: number, total: number) {
  if (count === 0) return RAMP[0]
  if (total <= 1) return RAMP[4]
  const ratio = count / total
  if (ratio <= 0.25) return RAMP[1]
  if (ratio <= 0.5) return RAMP[2]
  if (ratio < 1) return RAMP[3]
  return RAMP[4]
}

export function HabitHeatmap({ countsByDay, total, weeks = 26 }: Props) {
  const days = useMemo(() => heatmapDays(weeks), [weeks])
  const [hover, setHover] = useState<{ day: DayKey; x: number; y: number } | null>(null)

  // days is emitted in whole Mon-Sun weeks, so a fixed 7-row grid lines up.
  const columns = useMemo(() => {
    const out: DayKey[][] = []
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7))
    return out
  }, [days])

  const monthLabels = useMemo(
    () =>
      columns.map((col, i) => {
        const first = new Date(`${col[0]}T00:00:00`)
        const prev = i > 0 ? new Date(`${columns[i - 1][0]}T00:00:00`) : null
        const isNewMonth = !prev || prev.getMonth() !== first.getMonth()
        return isNewMonth ? first.toLocaleString(undefined, { month: 'short' }) : ''
      }),
    [columns],
  )

  return (
    <div className="relative min-w-0">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <div className="mt-[18px] flex shrink-0 flex-col gap-[3px] pr-1">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="h-[13px] text-[10px] leading-[13px] text-ink-muted">
              {d}
            </div>
          ))}
        </div>

        <div className="flex gap-[3px]">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              <div className="h-[15px] text-[10px] leading-[15px] whitespace-nowrap text-ink-muted">
                {monthLabels[ci]}
              </div>
              {col.map((day) => {
                const count = countsByDay.get(day) ?? 0
                return (
                  <button
                    key={day}
                    type="button"
                    aria-label={`${prettyDay(day)}: ${count} of ${total}`}
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect()
                      setHover({ day, x: r.left + r.width / 2, y: r.top })
                    }}
                    onMouseLeave={() => setHover(null)}
                    className="h-[13px] w-[13px] rounded-[3px] ring-1 ring-black/[0.04] transition-transform hover:scale-125 dark:ring-white/[0.06]"
                    style={{ background: rampStep(count, total) }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
        <span>Less</span>
        {RAMP.map((c) => (
          <span
            key={c}
            className="h-[11px] w-[11px] rounded-[3px] ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            style={{ background: c }}
          />
        ))}
        <span>More</span>
      </div>

      {hover && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-surface-1 px-2.5 py-1.5 text-[12px] shadow-lg"
          style={{ left: hover.x, top: hover.y - 8 }}
        >
          <div className="font-medium text-ink">{prettyDay(hover.day)}</div>
          <div className="text-ink-muted">
            {countsByDay.get(hover.day) ?? 0} of {total} habits
          </div>
        </div>
      )}
    </div>
  )
}

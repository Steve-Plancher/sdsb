import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { heatmapDays, prettyDay, type DayKey } from '@/lib/dates'

type Props = {
  /** How many habits were ticked on each day. */
  countsByDay: Map<DayKey, number>
  /** Denominator for the intensity ramp - the number of active habits. */
  total: number
  weeks?: number
}

const RAMP = ['var(--seq-0)', 'var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)']
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
  const scroller = useRef<HTMLDivElement>(null)

  // When the grid is wider than the card (a full year on a phone), open on the
  // most recent weeks rather than the oldest.
  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [weeks])

  // days is emitted in whole Mon-Sun weeks, so a fixed 7-row grid lines up.
  const columns = useMemo(() => {
    const out: DayKey[][] = []
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7))
    return out
  }, [days])

  // Label the first visible month and every month transition. Month names are
  // allowed to overflow their own cell, matching the existing label style.
  const monthLabels = useMemo(
    () =>
      columns.map((col, i) => {
        const first = new Date(`${col[0]}T00:00:00`)
        const prev = i > 0 ? new Date(`${columns[i - 1][0]}T00:00:00`) : null
        if (prev && prev.getMonth() === first.getMonth() && prev.getFullYear() === first.getFullYear()) return ''
        return first.toLocaleString(undefined, { month: 'short' })
      }),
    [columns],
  )

  return (
    <div className="relative min-w-0">
      <div ref={scroller} className="-mx-1 overflow-x-auto px-1 pb-1">
        {/* One CSS grid, filled column by column: squares stretch to fill the
            card (capped at ~28px) and a year simply scrolls sideways. */}
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: `auto repeat(${columns.length}, minmax(13px, 1fr))`,
            gridTemplateRows: '16px repeat(7, auto)',
            gridAutoFlow: 'column',
            maxWidth: `calc(2rem + ${columns.length} * 31px)`,
          }}
        >
          <span aria-hidden="true" />
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="flex items-center pr-1 text-[10px] text-ink-muted" aria-hidden="true">
              {d}
            </span>
          ))}

          {columns.flatMap((col, ci) => [
            <span key={`m${ci}`} className="overflow-visible text-[10px] leading-[16px] whitespace-nowrap text-ink-muted">
              {monthLabels[ci]}
            </span>,
            ...col.map((day) => {
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
                  className="aspect-square w-full rounded-[4px] ring-1 ring-black/[0.04] transition-transform hover:scale-110 dark:ring-white/[0.06]"
                  style={{ background: rampStep(count, total) }}
                />
              )
            }),
          ])}
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

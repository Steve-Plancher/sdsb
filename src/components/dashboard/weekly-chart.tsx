import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { lastNDays, prettyDay, type DayKey } from '@/lib/dates'

type Props = {
  countsByDay: Map<DayKey, number>
  total: number
  days?: number
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-surface-1 px-2.5 py-1.5 text-[12px] shadow-lg">
      <div className="font-medium text-ink">{prettyDay(label)}</div>
      <div className="text-ink-muted">{payload[0].value} habits completed</div>
    </div>
  )
}

/** Change over time for one measure - one series, so no legend box needed. */
export function WeeklyChart({ countsByDay, total, days = 30 }: Props) {
  const data = useMemo(
    () => lastNDays(days).map((d) => ({ date: d, count: countsByDay.get(d) ?? 0 })),
    [countsByDay, days],
  )

  return (
    <div className="h-[180px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" debounce={0}>
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="habitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={44}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickFormatter={(d: string) => prettyDay(d).slice(4)}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, Math.max(total, 1)]}
            tickCount={Math.min(Math.max(total, 1) + 1, 6)}
            tickLine={false}
            axisLine={false}
            width={28}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="url(#habitFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface-1)' }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

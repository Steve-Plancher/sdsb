import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type TrendPoint = { key: string; tick: string; tooltip: string; value: number }

type TooltipProps = { active?: boolean; payload?: { payload: TrendPoint }[]; unit: string }

function ChartTooltip({ active, payload, unit }: TooltipProps) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-surface-1 px-2.5 py-1.5 text-[12px] shadow-lg">
      <div className="font-semibold text-ink">{p.tooltip}</div>
      <div className="text-ink-muted">
        {p.value} {unit}
      </div>
    </div>
  )
}

/** Round a rough step up to 1, 2, 5, 10, 20, 50… so axis labels read naturally. */
function niceStep(rough: number) {
  const pow = 10 ** Math.floor(Math.log10(rough))
  const n = rough / pow
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow
}

/** Whole-number ticks: every value for small scales, four even steps otherwise. */
function axisTicks(max: number): number[] {
  const top = Math.max(max, 1)
  if (top <= 6) return Array.from({ length: top + 1 }, (_, i) => i)
  const step = niceStep(top / 4)
  return Array.from({ length: Math.ceil(top / step) + 1 }, (_, i) => i * step)
}

/** One measure over time — a single series, so the card title names it and there's no legend. */
export function TrendChart({ data, max, unit }: { data: TrendPoint[]; max: number; unit: string }) {
  const ticks = axisTicks(max)
  return (
    <div className="h-[190px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" debounce={0}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="tick"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={36}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, ticks[ticks.length - 1]]}
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            width={28}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: 'var(--border-strong)' }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="url(#trendFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface-1)' }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

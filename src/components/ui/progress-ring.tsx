/** A single completion ratio as a ring, with the count in the middle. */
export function ProgressRing({ done, total, size = 68 }: { done: number; total: number; size?: number }) {
  const stroke = 7
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = total > 0 ? Math.min(done / total, 1) : 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${done} of ${total} done`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      {ratio > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * ratio} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="var(--text-primary)"
        style={{ fontSize: size * 0.25, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
      >
        {done}/{total}
      </text>
    </svg>
  )
}

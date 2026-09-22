/**
 * The Growth Rings mark, drawn in theme colours so it follows light/dark mode.
 * Geometry matches branding/v1 (the PNG masters — that pack's SVGs are wrong).
 */
export function SdsbMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      aria-hidden="true"
      className={className}
    >
      <g fill="none">
        <path d="M764.8 299.9 A330 330 0 1 0 764.8 724.1" stroke="var(--accent)" strokeWidth="106" />
        <path d="M661.4 386.7 A195 195 0 1 0 661.4 637.3" stroke="var(--accent-soft)" strokeWidth="80" />
      </g>
      <ellipse cx="512" cy="512" rx="54" ry="76" fill="var(--accent)" />
    </svg>
  )
}

export function SdsbWordmark({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <SdsbMark size={size} />
      <span className="font-bold tracking-tight text-ink" style={{ fontSize: size * 0.72 }}>
        SDSB
      </span>
    </span>
  )
}

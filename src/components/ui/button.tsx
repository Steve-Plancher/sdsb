import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const button = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-ink hover:bg-accent-hover',
        ghost: 'text-ink-secondary hover:bg-surface-2 hover:text-ink',
        outline: 'border border-border bg-surface-1 text-ink-secondary hover:bg-surface-2',
      },
      size: {
        sm: 'h-7 px-2.5',
        md: 'h-9 px-3.5',
        icon: 'h-7 w-7',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  },
)

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>) {
  return <button className={cn(button({ variant, size }), className)} {...props} />
}

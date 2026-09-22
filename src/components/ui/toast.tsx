import { useEffect } from 'react'
import type { Toast as ToastData } from '@/hooks/use-brain'

/** Brief confirmation above the tab bar, with an optional Undo. */
export function Toast({ toast, onDismiss }: { toast: ToastData | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(onDismiss, 6000)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-50 flex justify-center px-4 sm:bottom-6"
    >
      <div className="flex max-w-sm items-center gap-3 rounded-full border border-border bg-surface-1 py-2.5 pr-2 pl-4 shadow-lg">
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">{toast.message}</span>
        {toast.undo && (
          <button
            type="button"
            onClick={toast.undo}
            className="shrink-0 rounded-full px-3 py-1.5 text-[14px] font-bold text-accent hover:bg-surface-2"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  )
}

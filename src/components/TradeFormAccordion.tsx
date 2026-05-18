import type { PropsWithChildren, ReactNode } from 'react'

export function TradeFormAccordion({
  title,
  description,
  open,
  onToggle,
  children,
}: PropsWithChildren<{
  title: string
  description?: string
  open: boolean
  onToggle: () => void
  badge?: ReactNode
}>) {
  const panelId = 'trade-form-optional-panel'

  return (
    <section className="rounded-2xl border border-[var(--tf-modal-border)] bg-[var(--tf-modal-surface-raised)]">
      <button
        type="button"
        id="trade-form-optional-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 rounded-2xl px-4 py-4 text-left transition duration-200 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] sm:px-5"
      >
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--tf-ink)]">{title}</span>
          {description ? (
            <span className="mt-1 block text-xs leading-relaxed text-[var(--tf-ink-muted)]">{description}</span>
          ) : null}
        </span>
        <span
          className={[
            'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/80 text-[var(--tf-ink-muted)] transition duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open ? (
        <div id={panelId} role="region" aria-labelledby="trade-form-optional-trigger" className="border-t border-[var(--tf-border)]/70 px-4 pb-5 pt-4 sm:px-5">
          {children}
        </div>
      ) : null}
    </section>
  )
}

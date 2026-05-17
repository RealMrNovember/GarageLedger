import type { PropsWithChildren, ReactNode } from 'react'

export function ModalSection({
  title,
  description,
  actions,
  children,
  className,
}: PropsWithChildren<{
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}>) {
  return (
    <section
      className={[
        'rounded-2xl border border-[var(--tf-modal-border)] bg-[var(--tf-modal-surface-raised)] p-4 sm:p-5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--tf-ink)]">{title}</h3>
          {description ? <p className="mt-1 text-xs leading-relaxed text-[var(--tf-ink-muted)]">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

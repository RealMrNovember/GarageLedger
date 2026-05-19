import type { ReactNode } from 'react'

export function PageShell({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={['mx-auto flex w-full max-w-7xl flex-col gap-6', className].filter(Boolean).join(' ')}>
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-[var(--tf-ink)]">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-[var(--tf-ink-muted)]">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}

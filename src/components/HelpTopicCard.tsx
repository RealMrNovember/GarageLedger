import type { ReactNode } from 'react'

export function HelpTopicCard({
  title,
  body,
  bullets,
  step,
  icon,
  footer,
}: {
  title: string
  body: string
  bullets?: string[]
  step?: number
  icon?: ReactNode
  footer?: ReactNode
}) {
  return (
    <article className="group rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)] p-5 shadow-[var(--tf-shadow)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--tf-accent)]/35 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/25">
      <div className="flex items-start gap-3">
        {step != null ? (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--tf-border)] bg-white/60 text-xs font-bold tabular-nums text-[var(--tf-accent)] shadow-sm dark:bg-white/5">
            {step}
          </span>
        ) : icon ? (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--tf-border)] bg-white/60 text-[var(--tf-ink-muted)] shadow-sm dark:bg-white/5">
            {icon}
          </span>
        ) : (
          <span className="inline-flex h-2 w-2 shrink-0 translate-y-2 rounded-full bg-[var(--tf-accent)]/80 ring-4 ring-[var(--tf-accent)]/15" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-[var(--tf-ink)]">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--tf-ink-muted)]">{body}</p>
          {bullets && bullets.length > 0 ? (
            <ul className="mt-3 space-y-1.5 border-t border-[var(--tf-border)]/60 pt-3">
              {bullets.map((b) => (
                <li key={b} className="flex gap-2 text-sm text-[var(--tf-ink)]">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--tf-accent)]/70" aria-hidden="true" />
                  <span className="min-w-0 leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {footer}
        </div>
      </div>
    </article>
  )
}

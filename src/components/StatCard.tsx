import { Card } from './Card'

export function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'profit' | 'count'
}) {
  const valueClass =
    tone === 'profit' ? 'text-[var(--tf-accent)]' : 'text-[var(--tf-ink)]'

  return (
    <Card className="flex min-h-[4.5rem] flex-col justify-center px-4 py-3.5">
      <div className="truncate text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tf-ink-muted)]">
        {label}
      </div>
      <div
        className={[
          'mt-1 truncate text-lg font-semibold tabular-nums leading-tight sm:text-xl',
          valueClass,
        ].join(' ')}
        title={value}
      >
        {value}
      </div>
    </Card>
  )
}

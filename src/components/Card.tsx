import type { PropsWithChildren } from 'react'

export function Card({
  children,
  className,
}: PropsWithChildren<{
  className?: string
}>) {
  return (
    <div
      className={[
        'rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)] shadow-[var(--tf-shadow)] transition duration-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

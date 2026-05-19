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
        'gl-elevated-card rounded-2xl transition duration-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

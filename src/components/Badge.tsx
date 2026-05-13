import type { PropsWithChildren } from 'react'

export function Badge({
  tone = 'neutral',
  children,
}: PropsWithChildren<{ tone?: 'neutral' | 'good' | 'bad' | 'info' }>) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium'
  const toneClass =
    tone === 'good'
      ? 'bg-emerald-500/12 text-emerald-800'
      : tone === 'bad'
        ? 'bg-rose-500/12 text-rose-800'
        : tone === 'info'
          ? 'bg-slate-900/8 text-slate-700'
          : 'bg-black/6 text-slate-700'

  return <span className={[base, toneClass].join(' ')}>{children}</span>
}


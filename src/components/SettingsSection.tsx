import type { ReactNode } from 'react'

export function SettingsDivider() {
  return <div className="border-b border-black/5 dark:border-white/5" aria-hidden />
}

export function SettingsSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tf-ink-muted)]">
      {children}
    </div>
  )
}

import type { ReactNode } from 'react'

/** @deprecated Use gap between SettingsPanel blocks instead */
export function SettingsDivider() {
  return null
}

export function SettingsSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tf-ink-muted)]">
      {children}
    </div>
  )
}

export function SettingsPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={['gl-elevated-card rounded-2xl p-5 md:p-6', className].filter(Boolean).join(' ')}>{children}</div>
}

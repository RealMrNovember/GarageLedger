import { Logo } from './Logo'
import { useTranslation } from 'react-i18next'
import { useEffect, useState, type ReactNode } from 'react'
import { formatFxDisplayTime, isFxStale, type FxUpdateMode } from '../lib/currency'
import { useFxSync } from '../lib/useFxSync'
import { i18n } from '../i18n'

export type NavKey = 'dashboard' | 'inventory' | 'reports' | 'customers' | 'help' | 'settings'

export function Sidebar({
  active,
  onNavigate,
  collapsed,
  onToggleCollapsed,
  theme,
  onToggleTheme,
  fxTick,
  fxMode,
  onRefreshFx,
}: {
  active: NavKey
  onNavigate: (next: NavKey) => void
  collapsed: boolean
  onToggleCollapsed: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  fxTick: number
  fxMode: FxUpdateMode
  onRefreshFx: () => void
}) {
  const { t } = useTranslation()
  const fx = useFxSync(fxTick)
  const fxFetchedAt = fx?.fetchedAt ?? null
  const [online, setOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine)
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  const stale = isFxStale(fxFetchedAt, fxMode)
  const timeLabel = formatFxDisplayTime(fxFetchedAt, i18n.language)
  const fxStatusClass = !fxFetchedAt
    ? 'text-[var(--tf-ink-muted)]'
    : !online || stale
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-[var(--tf-ink-muted)]'
  const fxStatusText = !fxFetchedAt
    ? t('settings.fx.never')
    : !online
      ? t('settings.fx.sidebarCached', { time: timeLabel })
      : stale
        ? t('settings.fx.sidebarStale', { time: timeLabel })
        : t('settings.fx.sidebarUpdated', { time: timeLabel })

  const itemBase =
    'w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition duration-200 hover:bg-black/5 active:translate-y-[0.5px]'
  const activeClass = 'bg-black/6 text-[var(--tf-ink)]'
  const idleClass = 'text-[var(--tf-ink-muted)]'

  const navItems: Array<{ key: NavKey; icon: ReactNode; label: string }> = [
    {
      key: 'dashboard',
      label: t('nav.dashboard'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 13.5V20h6v-6.5H4zM14 4v7.5h6V4h-6zM14 14.5V20h6v-5.5h-6zM4 4v7.5h6V4H4z" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ),
    },
    {
      key: 'inventory',
      label: t('nav.inventory'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M6 7v14h12V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M9 3h6l1 4H8l1-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'reports',
      label: t('nav.reports'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3h7l3 3v15H7V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M10 11h7M10 15h7M10 7h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: 'customers',
      label: t('nav.customers'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M16 11a4 4 0 1 0-8 0a4 4 0 0 0 8 0z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: 'help',
      label: t('nav.help'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 19v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M9.2 9.3a2.8 2.8 0 1 1 4.5 2.2c-.9.7-1.7 1.3-1.7 2.5V15"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path d="M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20z" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ),
    },
    {
      key: 'settings',
      label: t('nav.settings'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 15.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M19.4 15a8 8 0 0 0 .1-2l2-1.1l-2-3.4l-2.2.7a7.8 7.8 0 0 0-1.7-1L15 5.9h-6L8.4 8.2a7.8 7.8 0 0 0-1.7 1l-2.2-.7l-2 3.4l2 1.1a8 8 0 0 0 .1 2l-2 1.1l2 3.4l2.2-.7a7.8 7.8 0 0 0 1.7 1L9 22.1h6l.6-2.3a7.8 7.8 0 0 0 1.7-1l2.2.7l2-3.4l-2-1.1z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ]

  return (
    <aside
      className={[
        'sticky top-0 flex h-screen flex-col gap-4 border-r border-[var(--tf-border)] bg-[var(--tf-bg)] p-5 transition-[width] duration-200',
        collapsed ? 'w-20' : 'w-72',
      ].join(' ')}
    >
      <div className={['flex items-center', collapsed ? 'justify-center' : 'gap-3'].join(' ')}>
        <Logo size={34} />
        {!collapsed ? (
          <div className="leading-tight">
            <div className="text-sm font-semibold text-[var(--tf-ink)]">GarageLedger</div>
            <div className="text-xs text-[var(--tf-ink-muted)]">Cicibyte Corp</div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)] p-2 shadow-[var(--tf-shadow)]">
        <button
          type="button"
          className={[
            'mb-1 w-full rounded-2xl border border-[var(--tf-border)] bg-white/60 px-3 py-2 text-sm font-semibold text-[var(--tf-ink)] transition duration-200 hover:bg-black/5 dark:bg-white/10',
            collapsed ? 'flex items-center justify-center' : 'flex items-center justify-between',
          ].join(' ')}
          onClick={onToggleCollapsed}
        >
          <span className="inline-flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {!collapsed ? <span>Toggle</span> : null}
          </span>
          {!collapsed ? (
            <span className="text-xs text-[var(--tf-ink-muted)]">{collapsed ? '' : '⟷'}</span>
          ) : null}
        </button>

        {navItems.map((it) => (
          <button
            key={it.key}
            type="button"
            className={[
              itemBase,
              active === it.key ? activeClass : idleClass,
              collapsed ? 'flex items-center justify-center' : 'flex items-center gap-3',
            ].join(' ')}
            onClick={() => onNavigate(it.key)}
            title={collapsed ? it.label : undefined}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center">{it.icon}</span>
            {!collapsed ? <span className="min-w-0 truncate">{it.label}</span> : null}
          </button>
        ))}
      </div>

      <div className="mt-auto">
        <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)] p-3 shadow-[var(--tf-shadow)]">
          {!collapsed ? (
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--tf-ink-muted)]">
                {t('settings.theme.title')}
              </span>
              <span className={`truncate text-[11px] font-medium ${fxStatusClass}`} title={fxStatusText}>
                {fxStatusText}
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onRefreshFx()}
              className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--tf-border)] bg-white/50 px-2 text-[var(--tf-ink)] transition duration-200 hover:bg-black/5 dark:bg-white/5 dark:hover:bg-white/10"
              aria-label={t('settings.fx.refresh')}
              title={t('settings.fx.refresh')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M20 5v4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 19v-4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!collapsed ? <span className="truncate text-xs font-medium">{t('settings.fx.refresh')}</span> : null}
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="relative inline-flex h-9 w-14 shrink-0 items-center rounded-full border border-[var(--tf-border)] bg-white/50 px-1 transition duration-200 hover:bg-black/5 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <span className="sr-only">{t('settings.theme.toggle')}</span>
              <span className={['inline-block h-7 w-7 rounded-full bg-[var(--tf-accent)] shadow-sm transition duration-200', theme === 'dark' ? 'translate-x-5' : 'translate-x-0'].join(' ')} />
            </button>
          </div>
          {collapsed ? (
            <div className={`mt-2 text-center text-[10px] font-medium ${fxStatusClass}`} title={fxStatusText}>
              {fxFetchedAt ? timeLabel : '—'}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

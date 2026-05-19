import { Logo } from './Logo'
import { useTranslation } from 'react-i18next'
import { useEffect, useState, type ReactNode } from 'react'
import { formatFxDisplayTime, isFxStale, type FxUpdateMode } from '../lib/currency'
import { useFxSync } from '../lib/useFxSync'
import { i18n } from '../i18n'

export type NavKey = 'dashboard' | 'inventory' | 'reports' | 'customers' | 'help' | 'settings'

function FxRefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 5v4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19v-4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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
    'w-full rounded-xl text-sm font-medium transition duration-200 hover:bg-black/5 active:translate-y-[0.5px] dark:hover:bg-white/5'
  const activeClass = 'bg-black/6 text-[var(--tf-ink)] dark:bg-white/8'
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
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.6" />
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
        'sticky top-0 flex h-screen shrink-0 flex-col gap-4 border-r border-[var(--tf-border)]/60 bg-[var(--tf-bg)] p-4 transition-[width] duration-200',
        collapsed ? 'w-[4.75rem]' : 'w-72',
      ].join(' ')}
    >
      <div className={['flex items-center', collapsed ? 'justify-center' : 'gap-3'].join(' ')}>
        <Logo size={34} />
        {!collapsed ? (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-[var(--tf-ink)]">GarageLedger</div>
            <div className="truncate text-xs text-[var(--tf-ink-muted)]">Cicibyte Corp</div>
          </div>
        ) : null}
      </div>

      <nav className="gl-elevated-card flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto rounded-2xl p-2">
        <button
          type="button"
          className={[
            itemBase,
            'mb-1 border border-[var(--tf-border)]/50 bg-white/40 dark:bg-white/5',
            collapsed ? 'flex h-10 items-center justify-center px-0' : 'flex items-center justify-between px-3 py-2',
          ].join(' ')}
          onClick={onToggleCollapsed}
          title={collapsed ? t('nav.expand') : t('nav.collapse')}
          aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
        >
          <span className="inline-flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          {!collapsed ? <span className="text-xs text-[var(--tf-ink-muted)]">⟷</span> : null}
        </button>

        {navItems.map((it) => (
          <button
            key={it.key}
            type="button"
            className={[
              itemBase,
              active === it.key ? activeClass : idleClass,
              collapsed ? 'flex h-10 items-center justify-center px-0' : 'flex items-center gap-3 px-3 py-2.5',
            ].join(' ')}
            onClick={() => onNavigate(it.key)}
            title={collapsed ? it.label : undefined}
            aria-label={it.label}
          >
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{it.icon}</span>
            {!collapsed ? <span className="min-w-0 truncate">{it.label}</span> : null}
          </button>
        ))}
      </nav>

      <div className="gl-elevated-card shrink-0 rounded-2xl p-2">
        {!collapsed ? (
          <div className="mb-2 px-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--tf-ink-muted)]">
              {t('settings.theme.title')}
            </div>
            <div className={`mt-1 truncate text-[11px] font-medium ${fxStatusClass}`} title={fxStatusText}>
              {fxStatusText}
            </div>
          </div>
        ) : null}

        <div
          className={[
            'flex gap-2',
            collapsed ? 'flex-col items-center' : 'flex-row items-center',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={() => void onRefreshFx()}
            className={[
              'inline-flex items-center justify-center rounded-xl border border-[var(--tf-border)]/60 bg-white/50 text-[var(--tf-ink)] transition duration-200 hover:bg-black/5 dark:bg-white/5 dark:hover:bg-white/10',
              collapsed ? 'h-10 w-10' : 'h-10 min-w-0 flex-1 gap-1.5 px-3',
            ].join(' ')}
            aria-label={t('settings.fx.refresh')}
            title={collapsed ? `${t('settings.fx.refresh')} · ${fxStatusText}` : t('settings.fx.refresh')}
          >
            <FxRefreshIcon />
            {!collapsed ? <span className="truncate text-xs font-medium">{t('settings.fx.refresh')}</span> : null}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className={[
              'relative inline-flex shrink-0 items-center rounded-full border border-[var(--tf-border)]/60 bg-white/50 transition duration-200 hover:bg-black/5 dark:bg-white/5 dark:hover:bg-white/10',
              collapsed ? 'h-10 w-10 justify-center' : 'h-10 w-14 justify-start px-1',
            ].join(' ')}
            aria-label={t('settings.theme.toggle')}
            title={t('settings.theme.toggle')}
          >
            <span
              className={[
                'inline-block h-7 w-7 rounded-full bg-[var(--tf-accent)] shadow-sm transition duration-200',
                collapsed ? '' : theme === 'dark' ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
      </div>
    </aside>
  )
}

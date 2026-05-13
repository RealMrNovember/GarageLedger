import { Logo } from './Logo'
import { useTranslation } from 'react-i18next'

export type NavKey = 'dashboard' | 'inventory' | 'reports' | 'customers' | 'help' | 'settings'

export function Sidebar({
  active,
  onNavigate,
  theme,
  onToggleTheme,
}: {
  active: NavKey
  onNavigate: (next: NavKey) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}) {
  const { t } = useTranslation()

  const itemBase =
    'w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition duration-200 hover:bg-black/5 active:translate-y-[0.5px]'
  const activeClass = 'bg-black/6 text-[var(--tf-ink)]'
  const idleClass = 'text-[var(--tf-ink-muted)]'

  return (
    <aside className="sticky top-0 flex h-screen w-72 flex-col gap-4 border-r border-[var(--tf-border)] bg-[var(--tf-bg)] p-5">
      <div className="flex items-center gap-3">
        <Logo size={34} />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-[var(--tf-ink)]">GarageLedger</div>
          <div className="text-xs text-[var(--tf-ink-muted)]">Cicibyte Corp</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)] p-2 shadow-[var(--tf-shadow)]">
        <button
          type="button"
          className={[itemBase, active === 'dashboard' ? activeClass : idleClass].join(' ')}
          onClick={() => onNavigate('dashboard')}
        >
          {t('nav.dashboard')}
        </button>
        <button
          type="button"
          className={[itemBase, active === 'inventory' ? activeClass : idleClass].join(' ')}
          onClick={() => onNavigate('inventory')}
        >
          {t('nav.inventory')}
        </button>
        <button
          type="button"
          className={[itemBase, active === 'reports' ? activeClass : idleClass].join(' ')}
          onClick={() => onNavigate('reports')}
        >
          {t('nav.reports')}
        </button>
        <button
          type="button"
          className={[itemBase, active === 'customers' ? activeClass : idleClass].join(' ')}
          onClick={() => onNavigate('customers')}
        >
          {t('nav.customers')}
        </button>
        <button
          type="button"
          className={[itemBase, active === 'help' ? activeClass : idleClass].join(' ')}
          onClick={() => onNavigate('help')}
        >
          {t('nav.help')}
        </button>
        <button
          type="button"
          className={[itemBase, active === 'settings' ? activeClass : idleClass].join(' ')}
          onClick={() => onNavigate('settings')}
        >
          {t('nav.settings')}
        </button>
      </div>

      <div className="mt-auto">
        <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)] p-3 shadow-[var(--tf-shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('settings.theme.title')}</div>
            <button
              type="button"
              onClick={onToggleTheme}
              className="relative inline-flex h-9 w-16 items-center rounded-full border border-[var(--tf-border)] bg-white/50 px-1 transition duration-200 hover:bg-black/5 dark:bg-white/5"
            >
              <span className="sr-only">{t('settings.theme.toggle')}</span>
              <span
                className={[
                  'inline-block h-7 w-7 rounded-full bg-[var(--tf-accent)] shadow-sm transition duration-200',
                  theme === 'dark' ? 'translate-x-7' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          </div>
          <div className="mt-2 text-xs text-[var(--tf-ink-muted)]">
            {theme === 'dark' ? t('settings.theme.dark') : t('settings.theme.light')}
          </div>
        </div>
      </div>
    </aside>
  )
}

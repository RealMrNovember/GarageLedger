import { Logo } from './Logo'
import { useTranslation } from 'react-i18next'

export type NavKey = 'dashboard' | 'inventory' | 'settings'

export function Sidebar({
  active,
  onNavigate,
}: {
  active: NavKey
  onNavigate: (next: NavKey) => void
}) {
  const { t } = useTranslation()
  const itemBase =
    'w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition duration-200 hover:bg-black/5 active:translate-y-[0.5px]'
  const activeClass = 'bg-black/6 text-slate-900'
  const idleClass = 'text-slate-700'

  return (
    <aside className="flex w-72 flex-col gap-4 border-r border-[var(--tf-border)] bg-[var(--tf-bg)] p-5">
      <div className="flex items-center gap-3">
        <Logo size={34} />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">GarageLedger</div>
          <div className="text-xs text-slate-500">Cicibyte Corp</div>
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
          className={[itemBase, active === 'settings' ? activeClass : idleClass].join(' ')}
          onClick={() => onNavigate('settings')}
        >
          {t('nav.settings')}
        </button>
      </div>
    </aside>
  )
}

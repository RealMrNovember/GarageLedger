import type { CurrencyCode } from '../lib/currency'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { CurrencySelect } from './CurrencySelect'

export function Topbar({
  currency,
  onCurrencyChange,
  onOpenAbout,
}: {
  currency: CurrencyCode
  onCurrencyChange: (next: CurrencyCode) => void
  onOpenAbout: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--tf-border)] bg-[var(--tf-bg)] px-6 py-4">
      <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('app.name')}</div>
      <div className="flex items-center gap-3">
        <CurrencySelect value={currency} onChange={onCurrencyChange} />
        <Button variant="ghost" onClick={onOpenAbout}>
          {t('topbar.about')}
        </Button>
      </div>
    </div>
  )
}

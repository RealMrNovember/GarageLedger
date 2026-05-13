import type { CurrencyCode } from '../lib/currency'
import { useTranslation } from 'react-i18next'

export function CurrencySelect({
  value,
  onChange,
}: {
  value: CurrencyCode
  onChange: (next: CurrencyCode) => void
}) {
  const { t } = useTranslation()
  return (
    <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--tf-border)] bg-white/70 px-3 py-2 text-sm shadow-sm">
      <span className="text-slate-600">{t('topbar.currency')}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as CurrencyCode)}
        className="bg-transparent text-sm font-medium text-slate-900 outline-none"
      >
        <option value="AZN">AZN</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>
    </label>
  )
}

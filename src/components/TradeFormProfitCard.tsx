import { useTranslation } from 'react-i18next'
import { formatMoney, type CurrencyCode } from '../lib/currency'

export function TradeFormProfitCard({
  profit,
  currency,
  status,
}: {
  profit: number | null
  currency: CurrencyCode
  status: 'in_stock' | 'reserved' | 'sold'
}) {
  const { t } = useTranslation()
  const positive = profit != null && profit > 0
  const negative = profit != null && profit < 0

  return (
    <aside className="rounded-2xl border border-[var(--tf-modal-border)] bg-[var(--tf-modal-surface-raised)] p-5 shadow-[var(--tf-shadow)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tf-accent)]">
        {t('tradeForm.profit.kicker')}
      </div>
      <h3 className="mt-1 text-sm font-semibold text-[var(--tf-ink)]">{t('tradeForm.profit.title')}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[var(--tf-ink-muted)]">{t('tradeForm.profit.subtitle')}</p>

      <div
        className={[
          'mt-4 rounded-2xl border px-4 py-4',
          profit == null
            ? 'border-[var(--tf-border)] bg-[var(--tf-surface)]/50'
            : positive
              ? 'border-emerald-500/25 bg-emerald-500/10'
              : negative
                ? 'border-rose-500/25 bg-rose-500/10'
                : 'border-[var(--tf-border)] bg-[var(--tf-surface)]/60',
        ].join(' ')}
      >
        <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('tradeForm.profit.amount')}</div>
        <div
          className={[
            'mt-1 text-2xl font-semibold tabular-nums tracking-tight',
            profit == null
              ? 'text-[var(--tf-ink-muted)]'
              : positive
                ? 'text-emerald-700 dark:text-emerald-400'
                : negative
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-[var(--tf-ink)]',
          ].join(' ')}
        >
          {profit == null ? '—' : formatMoney(profit, currency)}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--tf-ink-muted)]">
          {profit == null
            ? status === 'in_stock'
              ? t('tradeForm.profit.hintInStock')
              : t('tradeForm.profit.hintNeedPrice')
            : t('tradeForm.profit.formula')}
        </p>
      </div>
    </aside>
  )
}

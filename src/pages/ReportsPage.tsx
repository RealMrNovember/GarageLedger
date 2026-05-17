import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { StatCard } from '../components/StatCard'
import { itemProfit, totalExpenses } from '../lib/compute'
import { formatMoney } from '../lib/currency'
import type { CurrencyCode } from '../lib/currency'
import { parseIsoDate, startOfDay, toIsoDateInputValue } from '../lib/dates'
import type { GarageLedgerSettings, TradeItem } from '../lib/types'
import { Modal } from '../components/Modal'
import { i18n } from '../i18n'
import {
  formatDatePdf,
  formatMoneyPdf,
  generateGarageLedgerPdf,
  type PdfExportOptions,
  type PdfMovementRow,
} from '../lib/pdfReport'

type PresetKey = 'today' | 'thisWeek' | 'thisMonth' | 'last30' | 'custom'
type MovementType = 'purchase' | 'reserved' | 'sold'

type MovementRow = {
  date: string
  type: MovementType
  vehicle: string
  purchasePrice: number
  sellPrice: number | null
  deposit: number | null
  expenses: number
  expenseNotes: string
  profit: number | null
  seller: string
  buyer: string
}

function formatVehicle(item: TradeItem): string {
  const brand = (item.brand ?? '').trim()
  const model = (item.model ?? '').trim()
  const year = item.year == null ? '' : String(item.year)
  const engine = (item.engine ?? '').trim()
  const head = [brand, model].filter(Boolean).join(' ')
  const tail = [year, engine].filter(Boolean).join(' · ')
  return [head, tail].filter(Boolean).join(' — ') || '—'
}

function inRange(iso: string, from: Date, to: Date): boolean {
  const d = startOfDay(parseIsoDate(iso))
  return d.getTime() >= from.getTime() && d.getTime() <= to.getTime()
}

function presetRange(preset: PresetKey, now = new Date()): { from: string; to: string } {
  const today = startOfDay(now)
  const to = toIsoDateInputValue(today)

  if (preset === 'today') return { from: to, to }

  if (preset === 'thisWeek') {
    const day = today.getDay()
    const diffFromMonday = (day + 6) % 7
    const from = new Date(today)
    from.setDate(from.getDate() - diffFromMonday)
    return { from: toIsoDateInputValue(from), to }
  }

  if (preset === 'thisMonth') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: toIsoDateInputValue(from), to }
  }

  const from = new Date(today)
  from.setDate(from.getDate() - 29)
  return { from: toIsoDateInputValue(from), to }
}

function movementTypeLabel(type: MovementType, t: (key: string) => string): string {
  if (type === 'purchase') return t('reports.types.purchase')
  if (type === 'reserved') return t('reports.types.reserved')
  return t('reports.types.sold')
}

function sanitizePdfText(value: string): string {
  return String(value ?? '')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .replaceAll('\t', ' ')
    .trim()
}

function expenseNotesText(item: TradeItem, currency: CurrencyCode): string {
  const lines = (item.expenses ?? [])
    .map((e) => {
      const amount = Number(e.amount ?? 0)
      const desc = String(e.description ?? '').trim()
      if (!amount && !desc) return ''
      if (!amount) return desc
      if (!desc) return formatMoneyPdf(amount, currency)
      return `${formatMoneyPdf(amount, currency)} - ${desc}`
    })
    .filter(Boolean)
  const tax = Number(item.tax ?? 0)
  const commission = Number(item.commission ?? 0)
  if (Number.isFinite(tax) && tax) lines.push(`${formatMoneyPdf(tax, currency)} - Tax`)
  if (Number.isFinite(commission) && commission) lines.push(`${formatMoneyPdf(commission, currency)} - Commission`)
  return lines.join('\n')
}

type CompanyProfile = NonNullable<GarageLedgerSettings['companyProfile']>

export function ReportsPage({
  items,
  currency,
  companyProfile,
}: {
  items: TradeItem[]
  currency: CurrencyCode
  companyProfile?: CompanyProfile
}) {
  const { t } = useTranslation()
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false)
  const [exportOpts, setExportOpts] = useState<PdfExportOptions>(() => {
    const lng =
      i18n.language === 'az' || i18n.language === 'tr' || i18n.language === 'en' || i18n.language === 'ru' ? i18n.language : 'az'
    return { language: lng, currency, paper: 'a4', theme: 'light', dateFormat: 'iso' }
  })
  const [preset, setPreset] = useState<PresetKey>('thisMonth')
  const initial = useMemo(() => presetRange('thisMonth'), [])
  const [from, setFrom] = useState<string>(initial.from)
  const [to, setTo] = useState<string>(initial.to)

  const resolvedRange = useMemo(() => {
    if (preset === 'custom') return { from, to }
    return presetRange(preset)
  }, [preset, from, to])

  const rows = useMemo(() => {
    const fromD = startOfDay(parseIsoDate(resolvedRange.from))
    const toD = startOfDay(parseIsoDate(resolvedRange.to))
    const out: MovementRow[] = []

    for (const item of items) {
      const vehicle = formatVehicle(item)
      const seller = [item.sellerName, item.sellerPhone].filter(Boolean).join(' · ')
      const buyer = [item.buyerName, item.buyerPhone].filter(Boolean).join(' · ')

      if (item.purchaseDate && inRange(item.purchaseDate, fromD, toD)) {
        out.push({
          date: item.purchaseDate,
          type: 'purchase',
          vehicle,
          purchasePrice: item.purchasePrice,
          sellPrice: null,
          deposit: null,
          expenses: totalExpenses(item),
          expenseNotes: expenseNotesText(item, currency),
          profit: null,
          seller,
          buyer: '',
        })
      }

      if (item.status === 'reserved' && item.reserveDate && inRange(item.reserveDate, fromD, toD)) {
        out.push({
          date: item.reserveDate,
          type: 'reserved',
          vehicle,
          purchasePrice: item.purchasePrice,
          sellPrice: item.sellPrice,
          deposit: item.deposit,
          expenses: totalExpenses(item),
          expenseNotes: expenseNotesText(item, currency),
          profit: null,
          seller,
          buyer,
        })
      }

      if (item.status === 'sold' && item.sellDate && inRange(item.sellDate, fromD, toD)) {
        out.push({
          date: item.sellDate,
          type: 'sold',
          vehicle,
          purchasePrice: item.purchasePrice,
          sellPrice: item.sellPrice,
          deposit: null,
          expenses: totalExpenses(item),
          expenseNotes: expenseNotesText(item, currency),
          profit: itemProfit(item),
          seller,
          buyer,
        })
      }
    }

    return out.sort((a, b) => b.date.localeCompare(a.date))
  }, [items, currency, resolvedRange.from, resolvedRange.to, t])

  const totals = useMemo(() => {
    const fromD = startOfDay(parseIsoDate(resolvedRange.from))
    const toD = startOfDay(parseIsoDate(resolvedRange.to))

    const investment = items.reduce((sum, item) => {
      if (!item.purchaseDate || !inRange(item.purchaseDate, fromD, toD)) return sum
      return sum + item.purchasePrice
    }, 0)

    const revenue = items.reduce((sum, item) => {
      if (item.status !== 'sold' || !item.sellDate || item.sellPrice == null) return sum
      if (!inRange(item.sellDate, fromD, toD)) return sum
      return sum + item.sellPrice
    }, 0)

    const netProfit = items.reduce((sum, item) => {
      if (item.status !== 'sold' || !item.sellDate) return sum
      if (!inRange(item.sellDate, fromD, toD)) return sum
      const p = itemProfit(item)
      if (p == null) return sum
      return sum + p
    }, 0)

    return { investment, revenue, netProfit }
  }, [items, resolvedRange.from, resolvedRange.to])

  const exportPdf = async (opts: PdfExportOptions) => {
    const tr = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ...(params ?? {}), lng: opts.language })

    const pdfRows: PdfMovementRow[] = rows.map((r) => ({
      date: formatDatePdf(r.date, opts.language, opts.dateFormat),
      typeLabel: movementTypeLabel(r.type, tr),
      vehicle: sanitizePdfText(r.vehicle),
      purchasePrice: formatMoneyPdf(r.purchasePrice, opts.currency),
      sellPrice: r.sellPrice == null ? '—' : formatMoneyPdf(r.sellPrice, opts.currency),
      expenses: r.expenses ? formatMoneyPdf(r.expenses, opts.currency) : '—',
      expenseNotes: r.expenseNotes ? sanitizePdfText(r.expenseNotes) : '—',
      profit: r.profit == null ? '—' : formatMoneyPdf(r.profit, opts.currency),
    }))

    const safeFrom = resolvedRange.from.replaceAll(':', '-')
    const safeTo = resolvedRange.to.replaceAll(':', '-')

    await generateGarageLedgerPdf({
      opts,
      tr,
      range: resolvedRange,
      totals,
      rows: pdfRows,
      companyProfile,
      fileName: `GarageLedger_Report_${safeFrom}_${safeTo}.pdf`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('reports.title')}</div>
          <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('reports.subtitle')}</div>
        </div>
        <Button
          onClick={() => {
            setExportOpts((prev) => ({ ...prev, currency }))
            setExportOptionsOpen(true)
          }}
        >
          {t('reports.export')}
        </Button>
      </div>

      <Modal
        title={t('reports.exportOptions.title')}
        open={exportOptionsOpen}
        onClose={() => setExportOptionsOpen(false)}
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-2xl border border-[var(--tf-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tf-ink)] transition duration-200 hover:bg-black/5 dark:bg-gray-950 dark:hover:bg-white/5"
              onClick={() => setExportOptionsOpen(false)}
            >
              {t('common.close')}
            </button>
            <button
              type="button"
              className="rounded-2xl bg-[var(--tf-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-[0.5px] hover:bg-black/90 hover:shadow-md dark:text-black dark:hover:bg-[#b89145]"
              onClick={() => {
                setExportOptionsOpen(false)
                void exportPdf(exportOpts)
              }}
            >
              {t('reports.exportOptions.export')}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('reports.exportOptions.language')}</div>
            <select
              value={exportOpts.language}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'az' || v === 'tr' || v === 'en' || v === 'ru') setExportOpts((p) => ({ ...p, language: v }))
              }}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            >
              <option value="az">AZ</option>
              <option value="tr">TR</option>
              <option value="en">EN</option>
              <option value="ru">RU</option>
            </select>
          </div>

          <div>
            <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('reports.exportOptions.currency')}</div>
            <select
              value={exportOpts.currency}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'AZN' || v === 'USD' || v === 'EUR' || v === 'TRY') setExportOpts((p) => ({ ...p, currency: v }))
              }}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            >
              <option value="AZN">AZN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="TRY">TRY</option>
            </select>
          </div>

          <div>
            <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('reports.exportOptions.dateFormat')}</div>
            <select
              value={exportOpts.dateFormat}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'iso' || v === 'dmy' || v === 'mdy' || v === 'locale') setExportOpts((p) => ({ ...p, dateFormat: v }))
              }}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            >
              <option value="iso">YYYY-MM-DD</option>
              <option value="dmy">DD.MM.YYYY</option>
              <option value="mdy">MM/DD/YYYY</option>
              <option value="locale">{t('reports.exportOptions.dateFormatLocale')}</option>
            </select>
          </div>

          <div>
            <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('reports.exportOptions.paper')}</div>
            <select
              value={exportOpts.paper}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'a4' || v === 'letter') setExportOpts((p) => ({ ...p, paper: v }))
              }}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            >
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('reports.exportOptions.theme')}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={[
                  'rounded-2xl border border-[var(--tf-border)] px-4 py-3 text-left text-sm font-semibold transition duration-200',
                  exportOpts.theme === 'light'
                    ? 'bg-[var(--tf-accent)] text-white dark:text-black'
                    : 'bg-[var(--tf-surface)]/70 text-[var(--tf-ink)] hover:bg-black/5 dark:hover:bg-white/5',
                ].join(' ')}
                onClick={() => setExportOpts((p) => ({ ...p, theme: 'light' }))}
              >
                {t('reports.exportOptions.themeLight')}
              </button>
              <button
                type="button"
                className={[
                  'rounded-2xl border border-[var(--tf-border)] px-4 py-3 text-left text-sm font-semibold transition duration-200',
                  exportOpts.theme === 'dark'
                    ? 'bg-[var(--tf-accent)] text-white dark:text-black'
                    : 'bg-[var(--tf-surface)]/70 text-[var(--tf-ink)] hover:bg-black/5 dark:hover:bg-white/5',
                ].join(' ')}
                onClick={() => setExportOpts((p) => ({ ...p, theme: 'dark' }))}
              >
                {t('reports.exportOptions.themeDark')}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Card className="p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('reports.filters.title')}</div>
            <div className="text-xs text-[var(--tf-ink-muted)]">
              {t('reports.filters.range', { from: resolvedRange.from, to: resolvedRange.to })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <select
                value={preset}
                onChange={(e) => {
                  const v = e.target.value as PresetKey
                  if (v === 'today' || v === 'thisWeek' || v === 'thisMonth' || v === 'last30' || v === 'custom') {
                    setPreset(v)
                    if (v !== 'custom') {
                      const r = presetRange(v)
                      setFrom(r.from)
                      setTo(r.to)
                    }
                  }
                }}
                className="w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
              >
                <option value="today">{t('reports.filters.presets.today')}</option>
                <option value="thisWeek">{t('reports.filters.presets.thisWeek')}</option>
                <option value="thisMonth">{t('reports.filters.presets.thisMonth')}</option>
                <option value="last30">{t('reports.filters.presets.last30')}</option>
                <option value="custom">{t('reports.filters.presets.custom')}</option>
              </select>
            </div>

            <div className="lg:col-span-4">
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/60 px-4 py-3 text-sm">
                <span className="text-[var(--tf-ink-muted)]">{t('reports.filters.from')}</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setPreset('custom')
                    setFrom(e.target.value)
                  }}
                  className="bg-transparent text-sm text-[var(--tf-ink)] outline-none"
                />
              </label>
            </div>

            <div className="lg:col-span-4">
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/60 px-4 py-3 text-sm">
                <span className="text-[var(--tf-ink-muted)]">{t('reports.filters.to')}</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setPreset('custom')
                    setTo(e.target.value)
                  }}
                  className="bg-transparent text-sm text-[var(--tf-ink)] outline-none"
                />
              </label>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard label={t('reports.summary.investment')} value={formatMoney(totals.investment, currency)} />
        <StatCard label={t('reports.summary.revenue')} value={formatMoney(totals.revenue, currency)} />
        <StatCard label={t('reports.summary.netProfit')} value={formatMoney(totals.netProfit, currency)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[var(--tf-surface)]/55">
              <tr className="text-xs font-semibold tracking-wide text-[var(--tf-ink-muted)]">
                <th className="px-5 py-4">{t('reports.table.date')}</th>
                <th className="px-5 py-4">{t('reports.table.type')}</th>
                <th className="px-5 py-4">{t('reports.table.vehicle')}</th>
                <th className="px-5 py-4">{t('reports.table.purchase')}</th>
                <th className="px-5 py-4">{t('reports.table.sale')}</th>
                <th className="px-5 py-4">{t('reports.table.expenses')}</th>
                <th className="px-5 py-4">{t('reports.table.profit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--tf-border)]">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-sm text-[var(--tf-ink-muted)]" colSpan={7}>
                    {t('reports.empty')}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={`${r.type}:${r.date}:${r.vehicle}`}
                    className="bg-[var(--tf-surface)]/40 transition duration-200 hover:bg-black/3 dark:hover:bg-white/5"
                  >
                    <td className="px-5 py-4 text-[var(--tf-ink-muted)]">{r.date}</td>
                    <td className="px-5 py-4 text-[var(--tf-ink-muted)]">{movementTypeLabel(r.type, t)}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-[var(--tf-ink)]">{r.vehicle}</div>
                      {r.type === 'reserved' ? (
                        <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">
                          {t('reports.reservedLine', {
                            deposit: formatMoney(r.deposit ?? 0, currency),
                            party: r.buyer || '—',
                          })}
                        </div>
                      ) : r.type === 'sold' ? (
                        <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{r.buyer || '—'}</div>
                      ) : (
                        <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{r.seller || '—'}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[var(--tf-ink)]">{formatMoney(r.purchasePrice, currency)}</td>
                    <td className="px-5 py-4 text-[var(--tf-ink)]">
                      {r.sellPrice == null ? '—' : formatMoney(r.sellPrice, currency)}
                    </td>
                    <td className="px-5 py-4 text-[var(--tf-ink)]">{r.expenses ? formatMoney(r.expenses, currency) : '—'}</td>
                    <td className="px-5 py-4 text-[var(--tf-ink)]">{r.profit == null ? '—' : formatMoney(r.profit, currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

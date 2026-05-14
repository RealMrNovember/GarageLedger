import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { StatCard } from '../components/StatCard'
import { itemProfit, totalExpenses } from '../lib/compute'
import { formatMoney } from '../lib/currency'
import type { CurrencyCode } from '../lib/currency'
import { parseIsoDate, startOfDay, toIsoDateInputValue } from '../lib/dates'
import type { TradeItem } from '../lib/types'

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

function formatMoneyPdf(value: number, currency: CurrencyCode): string {
  const amount = Number.isFinite(value) ? value : 0
  const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
  return `${formatted} ${currency}`
}

function sanitizePdfText(value: string): string {
  return value
    .replaceAll('—', '-')
    .replaceAll('·', '-')
    .replaceAll('→', '->')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
}

export function ReportsPage({ items, currency }: { items: TradeItem[]; currency: CurrencyCode }) {
  const { t } = useTranslation()
  const [preset, setPreset] = useState<PresetKey>('thisMonth')
  const initial = useMemo(() => presetRange('thisMonth'), [])
  const [from, setFrom] = useState<string>(initial.from)
  const [to, setTo] = useState<string>(initial.to)

  const resolvedRange = useMemo(() => {
    if (preset === 'custom') return { from, to }
    const r = presetRange(preset)
    return r
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
          profit: itemProfit(item),
          seller,
          buyer,
        })
      }
    }

    return out.sort((a, b) => b.date.localeCompare(a.date))
  }, [items, resolvedRange.from, resolvedRange.to])

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

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    const title = 'GarageLedger — Report'
    const rangeLabel = `${resolvedRange.from} - ${resolvedRange.to}`
    const currencyLabel = `Currency: ${currency}`

    autoTable(doc, {
      startY: 150,
      head: [
        [
          'Date',
          'Type',
          'Vehicle',
          'Purchase',
          'Sale',
          'Expenses',
          'Profit',
        ],
      ],
      body: rows.map((r) => [
        r.date,
        r.type === 'purchase' ? 'Purchase' : r.type === 'reserved' ? 'Reserved' : 'Sold',
        sanitizePdfText(r.vehicle),
        formatMoneyPdf(r.purchasePrice, currency),
        r.sellPrice == null ? '—' : formatMoneyPdf(r.sellPrice, currency),
        r.expenses ? formatMoneyPdf(r.expenses, currency) : '—',
        r.profit == null ? '—' : formatMoneyPdf(r.profit, currency),
      ]),
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 60 },
        2: { cellWidth: 160 },
        3: { cellWidth: 58, halign: 'right' },
        4: { cellWidth: 58, halign: 'right' },
        5: { cellWidth: 58, halign: 'right' },
        6: { cellWidth: 58, halign: 'right' },
      },
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        textColor: [30, 41, 59],
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [245, 240, 232],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: 40, right: 40 },
      didDrawPage: (data) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.text(title, 40, 44)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(rangeLabel, 40, 62)
        doc.setFontSize(9)
        doc.text(currencyLabel, 40, 78)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text(
          `Investment: ${formatMoneyPdf(totals.investment, currency)}`,
          40,
          98,
        )
        doc.text(
          `Revenue: ${formatMoneyPdf(totals.revenue, currency)}`,
          40,
          112,
        )
        doc.text(
          `Net Profit: ${formatMoneyPdf(totals.netProfit, currency)}`,
          40,
          126,
        )

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.text('Cicibyte Corp', pageWidth - 40, pageHeight - 22, { align: 'right' })
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(`Page ${data.pageNumber}`, 40, pageHeight - 22)

        doc.setDrawColor(226, 232, 240)
        doc.line(40, 136, pageWidth - 40, 136)
        doc.line(40, pageHeight - 32, pageWidth - 40, pageHeight - 32)
      },
    })

    const safeFrom = resolvedRange.from.replaceAll(':', '-')
    const safeTo = resolvedRange.to.replaceAll(':', '-')
    doc.save(`GarageLedger_Report_${safeFrom}_${safeTo}.pdf`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('reports.title')}</div>
          <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('reports.subtitle')}</div>
        </div>
        <Button onClick={exportPdf}>{t('reports.export')}</Button>
      </div>

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

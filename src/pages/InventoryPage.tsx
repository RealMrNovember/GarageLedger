import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { formatMoney } from '../lib/currency'
import type { CurrencyCode } from '../lib/currency'
import { itemProfit, isInStock, reservedRemainingBalance } from '../lib/compute'
import { parseIsoDate, startOfDay, toIsoDateInputValue } from '../lib/dates'
import type { Contact } from '../lib/types'
import type { TradeItem } from '../lib/types'
import { TradeFormModal } from './TradeFormModal'

function formatVehicle(item: TradeItem): string {
  const parts: string[] = []
  const brand = (item.brand ?? '').trim()
  const model = (item.model ?? '').trim()
  const engine = (item.engine ?? '').trim()
  const year = item.year == null ? '' : String(item.year)

  const head = [brand, model].filter(Boolean).join(' ')
  if (head) parts.push(head)
  if (year) parts.push(year)
  if (engine) parts.push(engine)

  if (parts.length >= 2) {
    const [a, b, ...rest] = parts
    const left = `${a} - ${b}`
    return rest.length ? `${left}, ${rest.join(', ')}` : left
  }
  return parts.join(', ') || '—'
}

export function InventoryPage({
  items,
  contacts,
  categories,
  currency,
  onUpsert,
  onRemove,
  onUpsertContact,
}: {
  items: TradeItem[]
  contacts: Contact[]
  categories: string[]
  currency: CurrencyCode
  onUpsert: (item: TradeItem) => void
  onRemove: (id: string) => void
  onUpsertContact: (contact: Contact) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TradeItem | undefined>(undefined)

  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string>('__all__')
  const [status, setStatus] = useState<'__all__' | 'active' | 'reserved' | 'sold'>('__all__')
  const [profitFilter, setProfitFilter] = useState<'__all__' | 'profit' | 'loss' | 'breakEven'>('__all__')
  const [purchaseFrom, setPurchaseFrom] = useState<string>('')
  const [purchaseTo, setPurchaseTo] = useState<string>('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const from = purchaseFrom ? startOfDay(parseIsoDate(purchaseFrom)) : null
    const to = purchaseTo ? startOfDay(parseIsoDate(purchaseTo)) : null

    return items
      .filter((item) => {
        if (query && !formatVehicle(item).toLowerCase().includes(query)) return false
        if (category !== '__all__' && item.category !== category) return false

        const inStock = isInStock(item)
        if (status === 'active' && !inStock) return false
        if (status === 'sold' && inStock) return false
        if (status === 'reserved' && item.status !== 'reserved') return false

        if (from || to) {
          const pd = startOfDay(parseIsoDate(item.purchaseDate))
          if (from && pd.getTime() < from.getTime()) return false
          if (to && pd.getTime() > to.getTime()) return false
        }

        if (profitFilter !== '__all__') {
          const p = itemProfit(item)
          if (p == null) return false
          if (profitFilter === 'profit' && !(p > 0)) return false
          if (profitFilter === 'loss' && !(p < 0)) return false
          if (profitFilter === 'breakEven' && p !== 0) return false
        }

        return true
      })
      .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
  }, [items, q, category, status, profitFilter, purchaseFrom, purchaseTo])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('inventory.title')}</div>
          <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('inventory.subtitle')}</div>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined)
            setOpen(true)
          }}
        >
          {t('inventory.new')}
        </Button>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('inventory.filters.title')}</div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-[var(--tf-ink-muted)]">{t('inventory.filters.results', { count: filtered.length })}</div>
              <Button
                variant="ghost"
                onClick={() => {
                  setQ('')
                  setCategory('__all__')
                  setStatus('__all__')
                  setProfitFilter('__all__')
                  setPurchaseFrom('')
                  setPurchaseTo('')
                }}
              >
                {t('inventory.filters.clear')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('inventory.filters.searchPlaceholder')}
                className="w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none placeholder:text-[var(--tf-ink-muted)] focus:border-black/20 dark:focus:border-white/20"
              />
            </div>

            <div className="lg:col-span-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
              >
                <option value="__all__">{t('inventory.filters.categoryAll')}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={status}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '__all__' || v === 'active' || v === 'reserved' || v === 'sold') setStatus(v)
                }}
                className="w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
              >
                <option value="__all__">{t('inventory.filters.statusAll')}</option>
                <option value="active">{t('inventory.filters.statusInStock')}</option>
                <option value="reserved">{t('inventory.filters.statusReserved')}</option>
                <option value="sold">{t('inventory.filters.statusSold')}</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <select
                value={profitFilter}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '__all__' || v === 'profit' || v === 'loss' || v === 'breakEven') setProfitFilter(v)
                }}
                className="w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
              >
                <option value="__all__">{t('inventory.filters.profitAll')}</option>
                <option value="profit">{t('inventory.filters.profitProfit')}</option>
                <option value="loss">{t('inventory.filters.profitLoss')}</option>
                <option value="breakEven">{t('inventory.filters.profitBreakEven')}</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/60 px-4 py-3 text-sm">
                <span className="text-[var(--tf-ink-muted)]">{t('inventory.filters.purchaseFrom')}</span>
                <input
                  type="date"
                  value={purchaseFrom}
                  onChange={(e) => setPurchaseFrom(e.target.value)}
                  className="bg-transparent text-sm text-[var(--tf-ink)] outline-none"
                />
              </label>
            </div>

            <div className="lg:col-span-3">
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/60 px-4 py-3 text-sm">
                <span className="text-[var(--tf-ink-muted)]">{t('inventory.filters.purchaseTo')}</span>
                <input
                  type="date"
                  value={purchaseTo}
                  onChange={(e) => setPurchaseTo(e.target.value)}
                  className="bg-transparent text-sm text-[var(--tf-ink)] outline-none"
                />
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[var(--tf-surface)]/55">
              <tr className="text-xs font-semibold tracking-wide text-[var(--tf-ink-muted)]">
                <th className="px-5 py-4">{t('inventory.table.vehicle')}</th>
                <th className="px-5 py-4">{t('inventory.table.category')}</th>
                <th className="px-5 py-4">{t('inventory.table.purchaseDate')}</th>
                <th className="px-5 py-4">{t('inventory.table.saleDate')}</th>
                <th className="px-5 py-4">{t('inventory.table.purchasePrice')}</th>
                <th className="px-5 py-4">{t('inventory.table.salePrice')}</th>
                <th className="px-5 py-4">{t('inventory.table.profit')}</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--tf-border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-sm text-[var(--tf-ink-muted)]" colSpan={8}>
                    {t('inventory.empty')}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const inStock = isInStock(item)
                  const profit = itemProfit(item)
                  const profitTone: 'neutral' | 'good' | 'bad' | 'info' =
                    profit == null ? 'info' : profit > 0 ? 'good' : profit < 0 ? 'bad' : 'neutral'
                  const remaining = reservedRemainingBalance(item)

                  return (
                    <tr key={item.id} className="bg-[var(--tf-surface)]/40 transition duration-200 hover:bg-black/3 dark:hover:bg-white/5">
                      <td className="px-5 py-4">
                        <div className="font-medium text-[var(--tf-ink)]">{formatVehicle(item)}</div>
                        {item.status === 'reserved' ? (
                          <div className="mt-2">
                            <Badge tone="neutral">{t('inventory.badge.reserved')}</Badge>
                          </div>
                        ) : inStock ? (
                          <div className="mt-2">
                            <Badge tone="info">{t('inventory.badge.inStock')}</Badge>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <Badge tone="good">{t('inventory.badge.sold')}</Badge>
                          </div>
                        )}
                        {item.status === 'reserved' ? (
                          <div className="mt-2 text-xs text-[var(--tf-ink-muted)]">
                            {t('inventory.reserved.line', {
                              deposit: formatMoney(item.deposit ?? 0, currency),
                              remaining: remaining == null ? '—' : formatMoney(remaining, currency),
                            })}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-[var(--tf-ink-muted)]">{item.category}</td>
                      <td className="px-5 py-4 text-[var(--tf-ink-muted)]">{item.purchaseDate}</td>
                      <td className="px-5 py-4 text-[var(--tf-ink-muted)]">{item.sellDate ?? '—'}</td>
                      <td className="px-5 py-4 text-[var(--tf-ink)]">{formatMoney(item.purchasePrice, currency)}</td>
                      <td className="px-5 py-4 text-[var(--tf-ink)]">
                        {item.sellPrice == null ? '—' : formatMoney(item.sellPrice, currency)}
                      </td>
                      <td className="px-5 py-4">
                        {profit == null ? (
                          <Badge tone="info">—</Badge>
                        ) : (
                          <Badge tone={profitTone}>{formatMoney(profit, currency)}</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setEditing(item)
                              setOpen(true)
                            }}
                          >
                            {t('inventory.actions.edit')}
                          </Button>
                          {inStock ? (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setEditing({
                                  ...item,
                                  status: 'sold',
                                  reserveDate: null,
                                  deposit: null,
                                  sellDate: item.sellDate ?? toIsoDateInputValue(new Date()),
                                  sellPrice: item.sellPrice ?? 0,
                                })
                                setOpen(true)
                              }}
                            >
                              {t('inventory.actions.markSold')}
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                const ok = window.confirm(t('inventory.actions.deleteConfirm'))
                                if (!ok) return
                                onRemove(item.id)
                              }}
                            >
                              {t('inventory.actions.delete')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <TradeFormModal
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        contacts={contacts}
        initial={editing}
        onSubmit={onUpsert}
        onUpsertContact={onUpsertContact}
      />
    </div>
  )
}

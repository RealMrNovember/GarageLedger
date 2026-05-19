import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PageShell } from '../components/PageShell'
import { InventoryTable } from '../components/InventoryTable'
import { CollapsibleFilterPanel } from '../components/CollapsibleFilterPanel'
import { Modal } from '../components/Modal'
import type { CurrencyCode } from '../lib/currency'
import { itemProfit, isInStock } from '../lib/compute'
import { parseIsoDate, startOfDay } from '../lib/dates'
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)

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

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (q.trim()) n++
    if (category !== '__all__') n++
    if (status !== '__all__') n++
    if (profitFilter !== '__all__') n++
    if (purchaseFrom) n++
    if (purchaseTo) n++
    return n
  }, [q, category, status, profitFilter, purchaseFrom, purchaseTo])

  const clearFilters = () => {
    setQ('')
    setCategory('__all__')
    setStatus('__all__')
    setProfitFilter('__all__')
    setPurchaseFrom('')
    setPurchaseTo('')
  }

  return (
    <PageShell
      title={t('inventory.title')}
      subtitle={t('inventory.subtitle')}
      actions={
        <Button
          onClick={() => {
            setEditing(undefined)
            setOpen(true)
          }}
        >
          {t('inventory.new')}
        </Button>
      }
    >
      <div className="relative z-10 shrink-0">
      <CollapsibleFilterPanel
        activeCount={activeFilterCount}
        summary={t('inventory.filters.results', { count: filtered.length })}
        actions={
          <Button variant="ghost" onClick={clearFilters}>
            {t('inventory.filters.clear')}
          </Button>
        }
      >
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
      </CollapsibleFilterPanel>
      </div>

      <Card className="relative z-0 overflow-hidden p-0">
        <InventoryTable
          items={filtered}
          currency={currency}
          onEdit={(item) => {
            setEditing(item)
            setOpen(true)
          }}
          onMarkSold={(item) => {
            setEditing(item)
            setOpen(true)
          }}
          onDeleteRequest={(item) => setDeleteTarget({ id: item.id, label: formatVehicle(item) })}
        />
      </Card>

      <TradeFormModal
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        contacts={contacts}
        currency={currency}
        initial={editing}
        onSubmit={onUpsert}
        onUpsertContact={onUpsertContact}
      />

      <Modal
        title={t('inventory.actions.deleteTitle')}
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-2xl border border-[var(--tf-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tf-ink)] transition duration-200 hover:bg-black/5 dark:bg-gray-950 dark:hover:bg-white/5"
              onClick={() => setDeleteTarget(null)}
            >
              {t('inventory.actions.cancel')}
            </button>
            <button
              type="button"
              className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-[0.5px] hover:bg-rose-700 hover:shadow-md"
              onClick={() => {
                if (!deleteTarget) return
                onRemove(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              {t('inventory.actions.delete')}
            </button>
          </div>
        }
      >
        <div className="space-y-2">
          <div className="text-sm text-[var(--tf-ink)]">{t('inventory.actions.deleteConfirm')}</div>
          {deleteTarget?.label ? <div className="text-xs text-[var(--tf-ink-muted)]">{deleteTarget.label}</div> : null}
        </div>
      </Modal>
    </PageShell>
  )
}

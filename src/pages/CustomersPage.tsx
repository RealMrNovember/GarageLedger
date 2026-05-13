import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { formatMoney } from '../lib/currency'
import type { CurrencyCode } from '../lib/currency'
import { itemProfit, totalExpenses } from '../lib/compute'
import type { TradeItem } from '../lib/types'

type Role = 'seller' | 'buyer'

type Party = {
  key: string
  name: string
  phone: string
  roles: Set<Role>
  deals: {
    id: string
    date: string
    role: Role
    vehicle: string
    purchasePrice: number
    sellPrice: number | null
    expenses: number
    profit: number | null
  }[]
}

function normalizeKey(name: string, phone: string): string {
  const p = (phone ?? '').trim()
  if (p) return `p:${p}`
  const n = (name ?? '').trim().toLowerCase()
  return n ? `n:${n}` : `u:${String(Math.random())}`
}

function formatVehicle(item: TradeItem): string {
  const brand = (item.brand ?? '').trim()
  const model = (item.model ?? '').trim()
  const year = item.year == null ? '' : String(item.year)
  const head = [brand, model].filter(Boolean).join(' ')
  return [head, year].filter(Boolean).join(' · ') || '—'
}

function bestToneForProfit(p: number | null): 'neutral' | 'good' | 'bad' | 'info' {
  if (p == null) return 'info'
  if (p > 0) return 'good'
  if (p < 0) return 'bad'
  return 'neutral'
}

export function CustomersPage({ items, currency }: { items: TradeItem[]; currency: CurrencyCode }) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [activeKey, setActiveKey] = useState<string>('')

  const parties = useMemo(() => {
    const map = new Map<string, Party>()

    const upsert = (role: Role, name: string, phone: string, item: TradeItem) => {
      const cleanName = (name ?? '').trim()
      const cleanPhone = (phone ?? '').trim()
      if (!cleanName && !cleanPhone) return

      const key = normalizeKey(cleanName || cleanPhone, cleanPhone)
      const existing =
        map.get(key) ??
        ({
          key,
          name: cleanName || cleanPhone,
          phone: cleanPhone,
          roles: new Set<Role>(),
          deals: [],
        } as Party)

      existing.roles.add(role)

      const profit = itemProfit(item)
      existing.deals.push({
        id: item.id,
        date: role === 'buyer' ? item.sellDate ?? item.reserveDate ?? item.purchaseDate : item.purchaseDate,
        role,
        vehicle: formatVehicle(item),
        purchasePrice: item.purchasePrice,
        sellPrice: item.sellPrice,
        expenses: totalExpenses(item),
        profit,
      })

      if (cleanName && (!existing.name || existing.name === existing.phone)) existing.name = cleanName
      if (cleanPhone && !existing.phone) existing.phone = cleanPhone
      map.set(key, existing)
    }

    for (const item of items) {
      upsert('seller', item.sellerName, item.sellerPhone, item)
      if (item.status !== 'in_stock') upsert('buyer', item.buyerName, item.buyerPhone, item)
    }

    return Array.from(map.values())
      .map((p) => ({ ...p, deals: p.deals.sort((a, b) => b.date.localeCompare(a.date)) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return parties
    return parties.filter((p) => {
      const name = p.name.toLowerCase()
      const phone = (p.phone ?? '').toLowerCase()
      return name.includes(query) || phone.includes(query)
    })
  }, [parties, q])

  const active = useMemo(() => {
    const fallback = filtered[0]?.key ?? ''
    const key = activeKey || fallback
    return filtered.find((p) => p.key === key) ?? null
  }, [filtered, activeKey])

  const summary = useMemo(() => {
    if (!active) return null

    const investment = active.deals.reduce((sum, d) => {
      if (d.role !== 'seller') return sum
      return sum + d.purchasePrice
    }, 0)

    const revenue = active.deals.reduce((sum, d) => {
      if (d.role !== 'buyer' || d.sellPrice == null) return sum
      return sum + d.sellPrice
    }, 0)

    const netProfit = active.deals.reduce((sum, d) => {
      if (d.role !== 'buyer') return sum
      return sum + (d.profit ?? 0)
    }, 0)

    return { investment, revenue, netProfit }
  }, [active])

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{t('customers.title')}</div>
        <div className="mt-1 text-xs text-slate-500">{t('customers.subtitle')}</div>
      </div>

      <Card className="p-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('customers.searchPlaceholder')}
          className="w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <div className="border-b border-[var(--tf-border)] px-5 py-4">
            <div className="text-sm font-semibold text-slate-900">{t('customers.listTitle')}</div>
            <div className="mt-1 text-xs text-slate-500">{t('customers.listCount', { count: filtered.length })}</div>
          </div>
          <div className="divide-y divide-[var(--tf-border)]">
            {filtered.length === 0 ? (
              <div className="px-5 py-6 text-sm text-slate-500">{t('customers.empty')}</div>
            ) : (
              filtered.map((p) => {
                const selected = active?.key === p.key
                const roles = Array.from(p.roles.values())
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActiveKey(p.key)}
                    className={[
                      'w-full px-5 py-4 text-left transition duration-200',
                      selected ? 'bg-black/5' : 'hover:bg-black/3',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{p.name || '—'}</div>
                        <div className="mt-1 truncate text-xs text-slate-500">{p.phone || '—'}</div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        {roles.includes('seller') ? <Badge tone="info">{t('customers.roles.seller')}</Badge> : null}
                        {roles.includes('buyer') ? <Badge tone="neutral">{t('customers.roles.buyer')}</Badge> : null}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{t('customers.dealCount', { count: p.deals.length })}</div>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        <Card className="lg:col-span-8">
          {!active ? (
            <div className="px-6 py-10 text-sm text-slate-500">{t('customers.selectHint')}</div>
          ) : (
            <div>
              <div className="border-b border-[var(--tf-border)] px-6 py-5">
                <div className="text-sm font-semibold text-slate-900">{active.name}</div>
                <div className="mt-1 text-xs text-slate-500">{active.phone || '—'}</div>
                {summary ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 px-4 py-3">
                      <div className="text-[11px] font-semibold tracking-wide text-slate-600">
                        {t('customers.summary.investment')}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatMoney(summary.investment, currency)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 px-4 py-3">
                      <div className="text-[11px] font-semibold tracking-wide text-slate-600">
                        {t('customers.summary.revenue')}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(summary.revenue, currency)}</div>
                    </div>
                    <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 px-4 py-3">
                      <div className="text-[11px] font-semibold tracking-wide text-slate-600">
                        {t('customers.summary.netProfit')}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatMoney(summary.netProfit, currency)}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead className="bg-white/45">
                    <tr className="text-xs font-semibold tracking-wide text-slate-600">
                      <th className="px-6 py-4">{t('customers.table.date')}</th>
                      <th className="px-6 py-4">{t('customers.table.role')}</th>
                      <th className="px-6 py-4">{t('customers.table.vehicle')}</th>
                      <th className="px-6 py-4">{t('customers.table.purchase')}</th>
                      <th className="px-6 py-4">{t('customers.table.sale')}</th>
                      <th className="px-6 py-4">{t('customers.table.expenses')}</th>
                      <th className="px-6 py-4">{t('customers.table.profit')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--tf-border)]">
                    {active.deals.map((d) => (
                      <tr key={`${d.role}:${d.id}`} className="bg-[var(--tf-surface)]/40">
                        <td className="px-6 py-4 text-slate-700">{d.date}</td>
                        <td className="px-6 py-4 text-slate-700">
                          {d.role === 'seller' ? t('customers.roles.seller') : t('customers.roles.buyer')}
                        </td>
                        <td className="px-6 py-4 text-slate-900">{d.vehicle}</td>
                        <td className="px-6 py-4 text-slate-900">{formatMoney(d.purchasePrice, currency)}</td>
                        <td className="px-6 py-4 text-slate-900">{d.sellPrice == null ? '—' : formatMoney(d.sellPrice, currency)}</td>
                        <td className="px-6 py-4 text-slate-900">{d.expenses ? formatMoney(d.expenses, currency) : '—'}</td>
                        <td className="px-6 py-4">
                          <Badge tone={bestToneForProfit(d.profit)}>
                            {d.profit == null ? '—' : formatMoney(d.profit, currency)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

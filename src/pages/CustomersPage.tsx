import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Modal } from '../components/Modal'
import { formatMoney } from '../lib/currency'
import type { CurrencyCode } from '../lib/currency'
import type { Contact, ContactRole, TradeItem } from '../lib/types'

function newId(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return String(Date.now())
}

function formatVehicle(item: TradeItem): string {
  const brand = (item.brand ?? '').trim()
  const model = (item.model ?? '').trim()
  const year = item.year == null ? '' : String(item.year)
  const head = [brand, model].filter(Boolean).join(' ')
  return [head, year].filter(Boolean).join(' · ') || '—'
}

type Tx = {
  id: string
  date: string
  role: 'seller' | 'buyer'
  vehicle: string
  purchasePrice: number
  sellPrice: number | null
  remainingBalance: number
}

function roleLabel(role: ContactRole, t: (key: string) => string): string {
  if (role === 'buyer') return t('customers.roles.buyer')
  if (role === 'seller') return t('customers.roles.seller')
  return t('customers.roles.both')
}

export function CustomersPage({
  items,
  contacts,
  currency,
  onUpsertContact,
}: {
  items: TradeItem[]
  contacts: Contact[]
  currency: CurrencyCode
  onUpsertContact: (contact: Contact) => void
}) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeId, setActiveId] = useState<string>('')
  const [editOpen, setEditOpen] = useState(false)

  const active = useMemo(() => contacts.find((c) => c.id === activeId) ?? null, [contacts, activeId])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const base = contacts.slice().sort((a, b) => a.name.localeCompare(b.name))
    if (!query) return base
    return base.filter((c) => {
      const name = (c.name ?? '').toLowerCase()
      const phone = (c.phone ?? '').toLowerCase()
      const email = (c.email ?? '').toLowerCase()
      return name.includes(query) || phone.includes(query) || email.includes(query)
    })
  }, [contacts, q])

  const txs = useMemo(() => {
    if (!active) return []
    const out: Tx[] = []
    for (const item of items) {
      if (item.sellerContactId === active.id) {
        out.push({
          id: item.id,
          date: item.purchaseDate,
          role: 'seller',
          vehicle: formatVehicle(item),
          purchasePrice: item.purchasePrice,
          sellPrice: item.sellPrice,
          remainingBalance: 0,
        })
      }
      if (item.buyerContactId === active.id) {
        out.push({
          id: item.id,
          date: item.sellDate ?? item.reserveDate ?? item.purchaseDate,
          role: 'buyer',
          vehicle: formatVehicle(item),
          purchasePrice: item.purchasePrice,
          sellPrice: item.sellPrice,
          remainingBalance: Number(item.remainingBalance ?? 0),
        })
      }
    }
    return out.sort((a, b) => b.date.localeCompare(a.date))
  }, [active, items])

  const summary = useMemo(() => {
    if (!active) return null
    const volume = txs.reduce((sum, x) => sum + (x.role === 'seller' ? x.purchasePrice : x.sellPrice ?? 0), 0)
    const remaining = txs.reduce((sum, x) => sum + (x.role === 'buyer' ? x.remainingBalance : 0), 0)
    return { volume, remaining, count: txs.length }
  }, [active, txs])

  const [form, setForm] = useState<Contact>({
    id: '',
    name: '',
    phone: '',
    email: '',
    role: 'both',
    notes: '',
    createdAt: '',
    updatedAt: '',
  })

  const openCreate = () => {
    const now = new Date().toISOString()
    setForm({ id: '', name: '', phone: '', email: '', role: 'both', notes: '', createdAt: now, updatedAt: now })
    setEditOpen(true)
  }

  const openEdit = (c: Contact) => {
    setForm({ ...c })
    setEditOpen(true)
  }

  const save = () => {
    const now = new Date().toISOString()
    const next: Contact = {
      ...form,
      id: form.id || newId(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
      createdAt: form.createdAt || now,
      updatedAt: now,
    }
    onUpsertContact(next)
    setEditOpen(false)
    setActiveId(next.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{t('customers.title')}</div>
          <div className="mt-1 text-xs text-slate-500">{t('customers.subtitle')}</div>
        </div>
        <Button onClick={openCreate}>{t('customers.actions.new')}</Button>
      </div>

      <Card className="p-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('customers.searchPlaceholder')}
          className="w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
        />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--tf-border)] px-5 py-4">
          <div className="text-sm font-semibold text-slate-900">{t('customers.listTitle')}</div>
          <div className="mt-1 text-xs text-slate-500">{t('customers.listCount', { count: filtered.length })}</div>
        </div>
        <div className="divide-y divide-[var(--tf-border)]">
          {filtered.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-500">{t('customers.empty')}</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveId(c.id)
                  setProfileOpen(true)
                }}
                className="w-full px-5 py-4 text-left transition duration-200 hover:bg-black/3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{c.name || '—'}</div>
                    <div className="mt-1 truncate text-xs text-slate-500">{[c.phone, c.email].filter(Boolean).join(' · ') || '—'}</div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <Badge tone="neutral">{roleLabel(c.role, t)}</Badge>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <Modal
        title={active ? t('customers.profileTitle', { name: active.name || '—' }) : t('customers.profileTitle', { name: '—' })}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            {active ? (
              <Button
                variant="ghost"
                onClick={() => {
                  openEdit(active)
                  setProfileOpen(false)
                }}
              >
                {t('customers.actions.edit')}
              </Button>
            ) : null}
            <Button onClick={() => setProfileOpen(false)}>{t('common.close')}</Button>
          </div>
        }
      >
        {!active ? (
          <div className="text-sm text-slate-500">{t('customers.selectHint')}</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 p-4">
              <div className="text-sm font-semibold text-slate-900">{active.name}</div>
              <div className="mt-1 text-xs text-slate-500">{[active.phone, active.email].filter(Boolean).join(' · ') || '—'}</div>
              <div className="mt-2 text-xs text-slate-500">{roleLabel(active.role, t)}</div>
              {active.notes ? <div className="mt-3 text-sm text-slate-700">{active.notes}</div> : null}
            </div>

            {summary ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 px-4 py-3">
                  <div className="text-[11px] font-semibold tracking-wide text-slate-600">{t('customers.profile.volume')}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(summary.volume, currency)}</div>
                </div>
                <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 px-4 py-3">
                  <div className="text-[11px] font-semibold tracking-wide text-slate-600">{t('customers.profile.remaining')}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(summary.remaining, currency)}</div>
                </div>
                <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 px-4 py-3">
                  <div className="text-[11px] font-semibold tracking-wide text-slate-600">{t('customers.profile.dealCount')}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{String(summary.count)}</div>
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-white/45">
                  <tr className="text-xs font-semibold tracking-wide text-slate-600">
                    <th className="px-5 py-4">{t('customers.table.date')}</th>
                    <th className="px-5 py-4">{t('customers.table.role')}</th>
                    <th className="px-5 py-4">{t('customers.table.vehicle')}</th>
                    <th className="px-5 py-4">{t('customers.table.purchase')}</th>
                    <th className="px-5 py-4">{t('customers.table.sale')}</th>
                    <th className="px-5 py-4">{t('customers.table.remaining')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--tf-border)]">
                  {txs.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-sm text-slate-500" colSpan={6}>
                        {t('customers.profile.noDeals')}
                      </td>
                    </tr>
                  ) : (
                    txs.map((x) => (
                      <tr key={`${x.role}:${x.id}`} className="bg-[var(--tf-surface)]/40">
                        <td className="px-5 py-4 text-slate-700">{x.date}</td>
                        <td className="px-5 py-4 text-slate-700">
                          {x.role === 'seller' ? t('customers.roles.seller') : t('customers.roles.buyer')}
                        </td>
                        <td className="px-5 py-4 text-slate-900">{x.vehicle}</td>
                        <td className="px-5 py-4 text-slate-900">{formatMoney(x.purchasePrice, currency)}</td>
                        <td className="px-5 py-4 text-slate-900">{x.sellPrice == null ? '—' : formatMoney(x.sellPrice, currency)}</td>
                        <td className="px-5 py-4 text-slate-900">
                          {x.remainingBalance > 0 ? formatMoney(x.remainingBalance, currency) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={form.id ? t('customers.actions.edit') : t('customers.actions.new')}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              {t('customers.actions.cancel')}
            </Button>
            <Button onClick={save} disabled={!form.name.trim() && !form.phone.trim()}>
              {t('customers.actions.save')}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="text-xs font-medium text-slate-600">{t('customers.form.name')}</div>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-slate-600">{t('customers.form.phone')}</div>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-600">{t('customers.form.email')}</div>
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
              />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600">{t('customers.form.role')}</div>
            <select
              value={form.role}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'buyer' || v === 'seller' || v === 'both') setForm((p) => ({ ...p, role: v }))
              }}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
            >
              <option value="buyer">{t('customers.roles.buyer')}</option>
              <option value="seller">{t('customers.roles.seller')}</option>
              <option value="both">{t('customers.roles.both')}</option>
            </select>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600">{t('customers.form.notes')}</div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={5}
              className="mt-2 w-full resize-none rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

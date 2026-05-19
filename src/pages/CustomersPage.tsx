import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { PageShell } from '../components/PageShell'
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
    <PageShell
      title={t('customers.title')}
      subtitle={t('customers.subtitle')}
      actions={<Button onClick={openCreate}>{t('customers.actions.new')}</Button>}
    >
      <div className="mx-auto w-full max-w-3xl">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('customers.searchPlaceholder')}
          className="gl-elevated-card w-full rounded-xl px-4 py-2.5 text-sm text-[var(--tf-ink)] outline-none placeholder:text-[var(--tf-ink-muted)] focus:ring-2 focus:ring-[var(--tf-accent)]/20"
        />

        <div className="mt-4 flex items-center justify-between px-1 text-xs text-[var(--tf-ink-muted)]">
          <span>{t('customers.listTitle')}</span>
          <span>{t('customers.listCount', { count: filtered.length })}</span>
        </div>

        <ul className="mt-2 space-y-2">
          {filtered.length === 0 ? (
            <li className="gl-elevated-card rounded-xl px-4 py-6 text-center text-sm text-[var(--tf-ink-muted)]">
              {t('customers.empty')}
            </li>
          ) : (
            filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(c.id)
                    setProfileOpen(true)
                  }}
                  className="gl-elevated-card flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:shadow-md"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--tf-accent)]/12 text-xs font-bold text-[var(--tf-accent)]">
                    {(c.name || '?').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[var(--tf-ink)]">{c.name || '—'}</span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--tf-ink-muted)]">
                      {[c.phone, c.email].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </span>
                  <Badge tone="neutral">{roleLabel(c.role, t)}</Badge>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <Modal
        title={active ? t('customers.profileTitle', { name: active.name || '—' }) : t('customers.profileTitle', { name: '—' })}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        size="lg"
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
          <div className="text-sm text-[var(--tf-ink-muted)]">{t('customers.selectHint')}</div>
        ) : (
          <div className="space-y-4">
            <div className="gl-elevated-card rounded-xl p-4">
              <div className="text-sm font-semibold text-[var(--tf-ink)]">{active.name}</div>
              <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{[active.phone, active.email].filter(Boolean).join(' · ') || '—'}</div>
              <div className="mt-2 text-xs text-[var(--tf-ink-muted)]">{roleLabel(active.role, t)}</div>
              {active.notes ? <div className="mt-3 text-sm text-[var(--tf-ink)]">{active.notes}</div> : null}
            </div>

            {summary ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="gl-elevated-card rounded-xl px-3 py-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tf-ink-muted)]">{t('customers.profile.volume')}</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums text-[var(--tf-ink)]">{formatMoney(summary.volume, currency)}</div>
                </div>
                <div className="gl-elevated-card rounded-xl px-3 py-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tf-ink-muted)]">{t('customers.profile.remaining')}</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums text-[var(--tf-ink)]">{formatMoney(summary.remaining, currency)}</div>
                </div>
                <div className="gl-elevated-card rounded-xl px-3 py-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tf-ink-muted)]">{t('customers.profile.dealCount')}</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums text-[var(--tf-ink)]">{String(summary.count)}</div>
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-[var(--tf-border)]/50">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-[var(--tf-surface)]/55">
                  <tr className="text-xs font-semibold tracking-wide text-[var(--tf-ink-muted)]">
                    <th className="px-4 py-3">{t('customers.table.date')}</th>
                    <th className="px-4 py-3">{t('customers.table.role')}</th>
                    <th className="px-4 py-3">{t('customers.table.vehicle')}</th>
                    <th className="px-4 py-3">{t('customers.table.remaining')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--tf-border)]/50">
                  {txs.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-sm text-[var(--tf-ink-muted)]" colSpan={4}>
                        {t('customers.profile.noDeals')}
                      </td>
                    </tr>
                  ) : (
                    txs.map((x) => (
                      <tr key={`${x.role}:${x.id}`}>
                        <td className="px-4 py-3 text-[var(--tf-ink-muted)]">{x.date}</td>
                        <td className="px-4 py-3 text-[var(--tf-ink-muted)]">
                          {x.role === 'seller' ? t('customers.roles.seller') : t('customers.roles.buyer')}
                        </td>
                        <td className="px-4 py-3 text-[var(--tf-ink)]">{x.vehicle}</td>
                        <td className="px-4 py-3 text-[var(--tf-ink)]">
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
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('customers.form.name')}</div>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-2.5 text-sm text-[var(--tf-ink)] outline-none focus:border-[var(--tf-accent)]/40"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('customers.form.phone')}</div>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-2.5 text-sm text-[var(--tf-ink)] outline-none focus:border-[var(--tf-accent)]/40"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('customers.form.email')}</div>
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-2.5 text-sm text-[var(--tf-ink)] outline-none focus:border-[var(--tf-accent)]/40"
              />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('customers.form.role')}</div>
            <select
              value={form.role}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'buyer' || v === 'seller' || v === 'both') setForm((p) => ({ ...p, role: v }))
              }}
              className="mt-2 w-full rounded-xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-2.5 text-sm text-[var(--tf-ink)] outline-none"
            >
              <option value="buyer">{t('customers.roles.buyer')}</option>
              <option value="seller">{t('customers.roles.seller')}</option>
              <option value="both">{t('customers.roles.both')}</option>
            </select>
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('customers.form.notes')}</div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-2.5 text-sm text-[var(--tf-ink)] outline-none focus:border-[var(--tf-accent)]/40"
            />
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}

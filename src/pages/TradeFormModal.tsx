import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { addDays, parseIsoDate, toIsoDateInputValue } from '../lib/dates'
import type { Contact, ContactRole, TradeItem } from '../lib/types'

function newId(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return String(Date.now())
}

export function TradeFormModal({
  open,
  onClose,
  categories,
  contacts,
  initial,
  onSubmit,
  onUpsertContact,
}: {
  open: boolean
  onClose: () => void
  categories: string[]
  contacts: Contact[]
  initial?: TradeItem
  onSubmit: (item: TradeItem) => void
  onUpsertContact: (contact: Contact) => void
}) {
  const { t } = useTranslation()
  const isEdit = Boolean(initial)

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState<number | ''>('')
  const [engine, setEngine] = useState('')
  const [vin, setVin] = useState('')
  const [vinLoading, setVinLoading] = useState(false)
  const [vinToast, setVinToast] = useState<string | null>(null)
  const [sellerContactId, setSellerContactId] = useState<string | null>(null)
  const [sellerName, setSellerName] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
  const [buyerContactId, setBuyerContactId] = useState<string | null>(null)
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [categoryMode, setCategoryMode] = useState<'select' | 'custom'>('select')
  const [category, setCategory] = useState('Otomobil')
  const [customCategory, setCustomCategory] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(toIsoDateInputValue(new Date()))
  const [purchasePrice, setPurchasePrice] = useState<number>(0)
  const [status, setStatus] = useState<'in_stock' | 'reserved' | 'sold'>('in_stock')
  const [reserveDate, setReserveDate] = useState(toIsoDateInputValue(new Date()))
  const [deposit, setDeposit] = useState<number>(0)
  const [sellDate, setSellDate] = useState(toIsoDateInputValue(new Date()))
  const [sellPrice, setSellPrice] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'installment' | 'barter'>('cash')
  const [downPayment, setDownPayment] = useState<number>(0)
  const [installmentCount, setInstallmentCount] = useState<number>(12)
  const [nextPaymentDate, setNextPaymentDate] = useState<string>(toIsoDateInputValue(addDays(new Date(), 30)))
  const [barterCash, setBarterCash] = useState<number>(0)
  const [tradeInBrand, setTradeInBrand] = useState<string>('')
  const [tradeInModel, setTradeInModel] = useState<string>('')
  const [tradeInYear, setTradeInYear] = useState<number | ''>('')
  const [tradeInEngine, setTradeInEngine] = useState<string>('')
  const [tradeInValue, setTradeInValue] = useState<number>(0)
  const [expenses, setExpenses] = useState<{ id: string; date: string; description: string; amount: number }[]>([])
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [contactModalTarget, setContactModalTarget] = useState<'seller' | 'buyer'>('seller')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactRole, setContactRole] = useState<ContactRole>('both')
  const [contactNotes, setContactNotes] = useState('')
  const [sellerQuery, setSellerQuery] = useState('')
  const [buyerQuery, setBuyerQuery] = useState('')
  const [sellerPickerOpen, setSellerPickerOpen] = useState(false)
  const [buyerPickerOpen, setBuyerPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!initial) {
      setBrand('')
      setModel('')
      setYear('')
      setEngine('')
      setVin('')
      setVinLoading(false)
      setVinToast(null)
      setSellerContactId(null)
      setSellerName('')
      setSellerPhone('')
      setBuyerContactId(null)
      setBuyerName('')
      setBuyerPhone('')
      setSellerQuery('')
      setBuyerQuery('')
      setSellerPickerOpen(false)
      setBuyerPickerOpen(false)
      setContactModalOpen(false)
      setContactModalTarget('seller')
      setContactName('')
      setContactPhone('')
      setContactEmail('')
      setContactRole('both')
      setContactNotes('')
      setCategoryMode('select')
      setCategory('Otomobil')
      setCustomCategory('')
      setPurchaseDate(toIsoDateInputValue(new Date()))
      setPurchasePrice(0)
      setStatus('in_stock')
      setReserveDate(toIsoDateInputValue(new Date()))
      setDeposit(0)
      setSellDate(toIsoDateInputValue(new Date()))
      setSellPrice(0)
      setPaymentMethod('cash')
      setDownPayment(0)
      setInstallmentCount(12)
      setNextPaymentDate(toIsoDateInputValue(addDays(new Date(), 30)))
      setBarterCash(0)
      setTradeInBrand('')
      setTradeInModel('')
      setTradeInYear('')
      setTradeInEngine('')
      setTradeInValue(0)
      setExpenses([])
      return
    }

    setBrand(initial.brand ?? '')
    setModel(initial.model ?? '')
    setYear(initial.year ?? '')
    setEngine(initial.engine ?? '')
    setVin(initial.vin ?? '')
    setVinLoading(false)
    setVinToast(null)
    setSellerContactId(initial.sellerContactId ?? null)
    setSellerName(initial.sellerName ?? '')
    setSellerPhone(initial.sellerPhone ?? '')
    setBuyerContactId(initial.buyerContactId ?? null)
    setBuyerName(initial.buyerName ?? '')
    setBuyerPhone(initial.buyerPhone ?? '')
    setSellerQuery('')
    setBuyerQuery('')
    setSellerPickerOpen(false)
    setBuyerPickerOpen(false)
    setContactModalOpen(false)
    const hasCategoryInList = categories.includes(initial.category)
    setCategoryMode(hasCategoryInList ? 'select' : 'custom')
    setCategory(hasCategoryInList ? initial.category : 'Otomobil')
    setCustomCategory(hasCategoryInList ? '' : initial.category)
    setPurchaseDate(initial.purchaseDate)
    setPurchasePrice(initial.purchasePrice)
    setStatus(initial.status ?? 'in_stock')
    setReserveDate(initial.reserveDate ?? toIsoDateInputValue(new Date()))
    setDeposit(initial.deposit ?? 0)
    setSellDate(initial.sellDate ?? toIsoDateInputValue(new Date()))
    setSellPrice(initial.sellPrice ?? 0)
    setPaymentMethod(initial.paymentMethod ?? 'cash')
    setDownPayment(initial.downPayment ?? 0)
    setInstallmentCount(initial.installmentCount ?? 12)
    setNextPaymentDate(initial.nextPaymentDate ?? toIsoDateInputValue(addDays(new Date(), 30)))
    setBarterCash(initial.barterCash ?? 0)
    setTradeInBrand(initial.tradeIn?.brand ?? '')
    setTradeInModel(initial.tradeIn?.model ?? '')
    setTradeInYear(initial.tradeIn?.year ?? '')
    setTradeInEngine(initial.tradeIn?.engine ?? '')
    setTradeInValue(initial.tradeIn?.value ?? 0)
    setExpenses(Array.isArray(initial.expenses) ? initial.expenses : [])
  }, [open, initial, categories])

  const resolvedCategory = useMemo(() => {
    const v = categoryMode === 'custom' ? customCategory : category
    return v.trim() || 'Diğer'
  }, [categoryMode, customCategory, category])

  const contactsById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts])
  const sellerSelected = useMemo(() => (sellerContactId ? contactsById.get(sellerContactId) ?? null : null), [contactsById, sellerContactId])
  const buyerSelected = useMemo(() => (buyerContactId ? contactsById.get(buyerContactId) ?? null : null), [contactsById, buyerContactId])

  useEffect(() => {
    if (!open) return
    if (!sellerSelected) return
    setSellerName(sellerSelected.name)
    setSellerPhone(sellerSelected.phone)
  }, [open, sellerSelected])

  useEffect(() => {
    if (!open) return
    if (!buyerSelected) return
    setBuyerName(buyerSelected.name)
    setBuyerPhone(buyerSelected.phone)
  }, [open, buyerSelected])

  const filteredSellerContacts = useMemo(() => {
    const q = sellerQuery.trim().toLowerCase()
    if (!q) return contacts.slice(0, 8)
    return contacts
      .filter((c) => {
        const name = (c.name ?? '').toLowerCase()
        const phone = (c.phone ?? '').toLowerCase()
        const email = (c.email ?? '').toLowerCase()
        return name.includes(q) || phone.includes(q) || email.includes(q)
      })
      .slice(0, 8)
  }, [contacts, sellerQuery])

  const filteredBuyerContacts = useMemo(() => {
    const q = buyerQuery.trim().toLowerCase()
    if (!q) return contacts.slice(0, 8)
    return contacts
      .filter((c) => {
        const name = (c.name ?? '').toLowerCase()
        const phone = (c.phone ?? '').toLowerCase()
        const email = (c.email ?? '').toLowerCase()
        return name.includes(q) || phone.includes(q) || email.includes(q)
      })
      .slice(0, 8)
  }, [contacts, buyerQuery])

  const canSubmitBase = brand.trim().length > 0 && purchaseDate.trim().length > 0 && Number.isFinite(purchasePrice)
  const installmentRemaining = useMemo(() => Math.max(0, Number(sellPrice) - Number(downPayment || 0)), [sellPrice, downPayment])
  const installmentMonthly = useMemo(() => {
    const c = Number(installmentCount || 0)
    if (!Number.isFinite(c) || c <= 0) return 0
    return installmentRemaining / c
  }, [installmentRemaining, installmentCount])
  const barterTotal = useMemo(() => Number(barterCash || 0) + Number(tradeInValue || 0), [barterCash, tradeInValue])
  const canSubmit =
    canSubmitBase &&
    (status === 'in_stock' ||
      (status === 'reserved' && Number.isFinite(sellPrice) && sellPrice > 0 && reserveDate.trim().length > 0) ||
      (status === 'sold' &&
        sellDate.trim().length > 0 &&
        (paymentMethod === 'cash'
          ? Number.isFinite(sellPrice) && sellPrice > 0
          : paymentMethod === 'installment'
            ? Number.isFinite(sellPrice) &&
              sellPrice > 0 &&
              Number.isFinite(downPayment) &&
              downPayment >= 0 &&
              downPayment <= sellPrice &&
              Number.isFinite(installmentCount) &&
              installmentCount > 0
            : Number.isFinite(barterTotal) &&
              barterTotal > 0 &&
              tradeInBrand.trim().length > 0 &&
              Number.isFinite(tradeInValue) &&
              tradeInValue > 0)))

  const canSaveContact = contactName.trim().length > 0 || contactPhone.trim().length > 0

  const showVinToast = (key: string) => {
    setVinToast(t(key))
    window.setTimeout(() => setVinToast(null), 2800)
  }

  const decodeVin = async () => {
    const v = vin.trim().toUpperCase()
    if (!v) return
    setVinToast(null)
    setVinLoading(true)
    try {
      const ctrl = new AbortController()
      const timeout = window.setTimeout(() => ctrl.abort(), 9000)
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(v)}?format=json`, {
        signal: ctrl.signal,
      })
      window.clearTimeout(timeout)
      if (!res.ok) {
        showVinToast('vinDecoder.notFound')
        return
      }
      const json = (await res.json()) as { Results?: Array<Record<string, string | null | undefined>> }
      const r = json?.Results?.[0]
      if (!r || typeof r !== 'object') {
        showVinToast('vinDecoder.notFound')
        return
      }

      const make = String(r.Make ?? '').trim()
      const nextModel = String(r.Model ?? '').trim()
      const yearRaw = String(r.ModelYear ?? '').trim()
      const displacement = String(r.DisplacementL ?? '').trim()
      const fuel = String(r.FuelTypePrimary ?? '').trim()

      const parsedYear = Number(yearRaw)
      const yearValue = Number.isFinite(parsedYear) && parsedYear > 1900 ? parsedYear : null

      const hasAny = Boolean(make || nextModel || yearValue || displacement || fuel)
      if (!hasAny) {
        showVinToast('vinDecoder.notFound')
        return
      }

      if (make) setBrand(make)
      if (nextModel) setModel(nextModel)
      if (yearValue != null) setYear(yearValue)

      const dispPart = displacement ? `${displacement}L` : ''
      const fuelPart = fuel ? fuel : ''
      const combined = [dispPart, fuelPart].filter(Boolean).join(' · ')
      if (combined) setEngine(combined)
    } catch {
      showVinToast('vinDecoder.notFound')
    } finally {
      setVinLoading(false)
    }
  }

  return (
    <>
      <Modal
        title={isEdit ? t('tradeForm.editTitle') : t('tradeForm.createTitle')}
        open={open}
        onClose={onClose}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t('tradeForm.cancel')}
            </Button>
            <Button
              onClick={() => {
              const normalizedExpenses = expenses
                .map((e) => ({
                  id: e.id,
                  date: String(e.date ?? ''),
                  description: String(e.description ?? ''),
                  amount: Number(e.amount ?? 0),
                }))
                .filter((e) => e.id && e.date && e.description && Number.isFinite(e.amount))
              const base: TradeItem = {
                id: initial?.id ?? newId(),
                brand: brand.trim(),
                model: model.trim(),
                year: year === '' ? null : Number(year),
                engine: engine.trim(),
                vin: vin.trim(),
                category: resolvedCategory,
                purchaseDate,
                status,
                reserveDate: status === 'reserved' ? reserveDate : null,
                deposit: status === 'reserved' ? Number(deposit) : null,
                paymentMethod: status === 'sold' ? paymentMethod : 'cash',
                downPayment: status === 'sold' && paymentMethod === 'installment' ? Number(downPayment) : null,
                installmentCount: status === 'sold' && paymentMethod === 'installment' ? Number(installmentCount) : null,
                remainingBalance:
                  status === 'sold'
                    ? paymentMethod === 'installment'
                      ? installmentRemaining
                      : 0
                    : null,
                nextPaymentDate:
                  status === 'sold' && paymentMethod === 'installment'
                    ? nextPaymentDate || toIsoDateInputValue(addDays(parseIsoDate(sellDate), 30))
                    : null,
                barterCash: status === 'sold' && paymentMethod === 'barter' ? Number(barterCash) : null,
                tradeIn:
                  status === 'sold' && paymentMethod === 'barter'
                    ? {
                        brand: tradeInBrand.trim(),
                        model: tradeInModel.trim(),
                        year: tradeInYear === '' ? null : Number(tradeInYear),
                        engine: tradeInEngine.trim(),
                        value: Number(tradeInValue),
                      }
                    : null,
                sellerContactId,
                sellerName: sellerName.trim(),
                sellerPhone: sellerPhone.trim(),
                buyerContactId: status === 'in_stock' ? null : buyerContactId,
                buyerName: status === 'in_stock' ? '' : buyerName.trim(),
                buyerPhone: status === 'in_stock' ? '' : buyerPhone.trim(),
                purchasePrice: Number(purchasePrice),
                sellDate: status === 'sold' ? sellDate : null,
                sellPrice:
                  status === 'reserved'
                    ? Number(sellPrice)
                    : status === 'sold'
                      ? paymentMethod === 'barter'
                        ? barterTotal
                        : Number(sellPrice)
                      : null,
                expenses: normalizedExpenses,
              }
              onSubmit(base)
              if (status === 'sold' && paymentMethod === 'barter') {
                const tradeInPrice = Number(tradeInValue)
                const tradeInItem: TradeItem = {
                  id: newId(),
                  brand: tradeInBrand.trim(),
                  model: tradeInModel.trim(),
                  year: tradeInYear === '' ? null : Number(tradeInYear),
                  engine: tradeInEngine.trim(),
                  vin: '',
                  category: resolvedCategory,
                  purchaseDate: sellDate,
                  status: 'in_stock',
                  reserveDate: null,
                  deposit: null,
                  paymentMethod: 'cash',
                  downPayment: null,
                  installmentCount: null,
                  remainingBalance: null,
                  nextPaymentDate: null,
                  barterCash: null,
                  tradeIn: null,
                  sellerContactId: buyerContactId,
                  sellerName: buyerName.trim(),
                  sellerPhone: buyerPhone.trim(),
                  buyerContactId: null,
                  buyerName: '',
                  buyerPhone: '',
                  sellDate: null,
                  purchasePrice: Number.isFinite(tradeInPrice) ? tradeInPrice : 0,
                  sellPrice: null,
                  expenses: [],
                }
                onSubmit(tradeInItem)
              }
              onClose()
              }}
              disabled={!canSubmit}
            >
              {t('tradeForm.save')}
            </Button>
          </div>
        }
      >
      <div className="grid grid-cols-1 gap-4">
        <div>
          <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.brand')}</div>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder={t('tradeForm.fields.brandPlaceholder')}
            className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.model')}</div>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t('tradeForm.fields.modelPlaceholder')}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
            />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.year')}</div>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={t('tradeForm.fields.yearPlaceholder')}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
            />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.engine')}</div>
            <input
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              placeholder={t('tradeForm.fields.enginePlaceholder')}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-medium text-slate-600">{t('vinDecoder.vinLabel')}</div>
            {vinToast ? <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{vinToast}</div> : null}
          </div>
          <div className="mt-2 flex items-stretch gap-2">
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder={t('vinDecoder.vinPlaceholder')}
              className="w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none placeholder:text-[var(--tf-ink-muted)] focus:border-black/20 dark:focus:border-white/20"
            />
            <button
              type="button"
              onClick={() => void decodeVin()}
              disabled={vinLoading || vin.trim().length < 5}
              className={[
                'inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition duration-200',
                'border-[var(--tf-border)] bg-[var(--tf-surface)]/60 text-[var(--tf-ink)] hover:bg-black/5 dark:hover:bg-white/5',
                'disabled:cursor-not-allowed disabled:opacity-60',
              ].join(' ')}
            >
              {vinLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/60 dark:border-white/20 dark:border-t-white/60" />
                  {t('vinDecoder.loading')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="opacity-80">
                    <path
                      d="M9 3l1.2 5.4L16 10l-5.4 1.2L9 17l-1.2-5.8L2 10l5.8-1.6L9 3z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18 4l.7 2.9L22 8l-3.3.8L18 12l-.7-3.2L14 8l3.3-1.1L18 4z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {t('vinDecoder.fetch')}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--tf-border)] bg-white/50 p-4">
          <div className="text-xs font-semibold text-slate-700">{t('tradeForm.sections.parties')}</div>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.seller')}</div>
                <Button
                  variant="ghost"
                  className="px-3 py-1 text-xs"
                  onClick={() => {
                    setContactModalTarget('seller')
                    setContactRole('seller')
                    setContactName(sellerQuery || sellerName)
                    setContactPhone(sellerPhone)
                    setContactEmail('')
                    setContactNotes('')
                    setContactModalOpen(true)
                  }}
                >
                  {t('tradeForm.actions.addContact')}
                </Button>
              </div>
              <div className="relative mt-2">
                <input
                  value={
                    sellerSelected
                      ? [sellerSelected.name, sellerSelected.phone].filter(Boolean).join(' · ')
                      : sellerQuery
                  }
                  onChange={(e) => {
                    setSellerContactId(null)
                    setSellerQuery(e.target.value)
                    setSellerPickerOpen(true)
                  }}
                  onFocus={() => setSellerPickerOpen(true)}
                  onBlur={() => setTimeout(() => setSellerPickerOpen(false), 120)}
                  placeholder={t('tradeForm.fields.contactSearchPlaceholder')}
                  className="w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none placeholder:text-[var(--tf-ink-muted)] focus:border-black/20 dark:focus:border-white/20"
                />
                {sellerSelected ? (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--tf-ink-muted)] hover:text-[var(--tf-ink)]"
                    onClick={() => {
                      setSellerContactId(null)
                      setSellerQuery('')
                    }}
                  >
                    {t('tradeForm.actions.clearContact')}
                  </button>
                ) : null}
                {sellerPickerOpen && !sellerSelected ? (
                  <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)] shadow-[var(--tf-shadow)]">
                    {filteredSellerContacts.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-[var(--tf-ink-muted)]">{t('tradeForm.emptyContacts')}</div>
                    ) : (
                      <div className="divide-y divide-[var(--tf-border)]">
                        {filteredSellerContacts.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full px-4 py-3 text-left text-sm text-[var(--tf-ink)] hover:bg-black/5 dark:hover:bg-white/5"
                            onClick={() => {
                              setSellerContactId(c.id)
                              setSellerQuery('')
                              setSellerPickerOpen(false)
                            }}
                          >
                            <div className="font-semibold text-[var(--tf-ink)]">{c.name || '—'}</div>
                            <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">
                              {[c.phone, c.email].filter(Boolean).join(' · ') || '—'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('tradeForm.fields.sellerPhone')}</div>
              <input
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder={t('tradeForm.fields.sellerPhonePlaceholder')}
                className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none placeholder:text-[var(--tf-ink-muted)] focus:border-black/20 dark:focus:border-white/20"
              />
            </div>
          </div>

          {status === 'in_stock' ? null : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.buyer')}</div>
                  <Button
                    variant="ghost"
                    className="px-3 py-1 text-xs"
                    onClick={() => {
                      setContactModalTarget('buyer')
                      setContactRole('buyer')
                      setContactName(buyerQuery || buyerName)
                      setContactPhone(buyerPhone)
                      setContactEmail('')
                      setContactNotes('')
                      setContactModalOpen(true)
                    }}
                  >
                    {t('tradeForm.actions.addContact')}
                  </Button>
                </div>
                <div className="relative mt-2">
                  <input
                    value={buyerSelected ? [buyerSelected.name, buyerSelected.phone].filter(Boolean).join(' · ') : buyerQuery}
                    onChange={(e) => {
                      setBuyerContactId(null)
                      setBuyerQuery(e.target.value)
                      setBuyerPickerOpen(true)
                    }}
                    onFocus={() => setBuyerPickerOpen(true)}
                    onBlur={() => setTimeout(() => setBuyerPickerOpen(false), 120)}
                    placeholder={t('tradeForm.fields.contactSearchPlaceholder')}
                  className="w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none placeholder:text-[var(--tf-ink-muted)] focus:border-black/20 dark:focus:border-white/20"
                  />
                  {buyerSelected ? (
                    <button
                      type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--tf-ink-muted)] hover:text-[var(--tf-ink)]"
                      onClick={() => {
                        setBuyerContactId(null)
                        setBuyerQuery('')
                      }}
                    >
                      {t('tradeForm.actions.clearContact')}
                    </button>
                  ) : null}
                  {buyerPickerOpen && !buyerSelected ? (
                    <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)] shadow-[var(--tf-shadow)]">
                      {filteredBuyerContacts.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-[var(--tf-ink-muted)]">{t('tradeForm.emptyContacts')}</div>
                      ) : (
                        <div className="divide-y divide-[var(--tf-border)]">
                          {filteredBuyerContacts.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="w-full px-4 py-3 text-left text-sm text-[var(--tf-ink)] hover:bg-black/5 dark:hover:bg-white/5"
                              onClick={() => {
                                setBuyerContactId(c.id)
                                setBuyerQuery('')
                                setBuyerPickerOpen(false)
                              }}
                            >
                              <div className="font-semibold text-[var(--tf-ink)]">{c.name || '—'}</div>
                              <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">
                                {[c.phone, c.email].filter(Boolean).join(' · ') || '—'}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('tradeForm.fields.buyerPhone')}</div>
                <input
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder={t('tradeForm.fields.buyerPhonePlaceholder')}
                  className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none placeholder:text-[var(--tf-ink-muted)] focus:border-black/20 dark:focus:border-white/20"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('tradeForm.fields.category')}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategoryMode('select')}
                className={[
                  'rounded-2xl border px-3 py-2 text-sm font-medium',
                  categoryMode === 'select'
                    ? 'border-[var(--tf-border)] bg-black/5 text-[var(--tf-ink)] dark:bg-white/5'
                    : 'border-[var(--tf-border)] bg-[var(--tf-surface)]/60 text-[var(--tf-ink-muted)] hover:bg-black/5 dark:hover:bg-white/5',
                ].join(' ')}
              >
                {t('tradeForm.fields.categorySelect')}
              </button>
              <button
                type="button"
                onClick={() => setCategoryMode('custom')}
                className={[
                  'rounded-2xl border px-3 py-2 text-sm font-medium',
                  categoryMode === 'custom'
                    ? 'border-[var(--tf-border)] bg-black/5 text-[var(--tf-ink)] dark:bg-white/5'
                    : 'border-[var(--tf-border)] bg-[var(--tf-surface)]/60 text-[var(--tf-ink-muted)] hover:bg-black/5 dark:hover:bg-white/5',
                ].join(' ')}
              >
                {t('tradeForm.fields.categoryCustom')}
              </button>
            </div>

            {categoryMode === 'select' ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder={t('tradeForm.fields.categoryPlaceholder')}
                className="mt-3 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
              />
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.purchaseDate')}</div>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.purchasePrice')}</div>
            <input
              type="number"
              value={Number.isFinite(purchasePrice) ? purchasePrice : 0}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.status')}</div>
            <select
              value={status}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'in_stock' || v === 'reserved' || v === 'sold') setStatus(v)
              }}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
            >
              <option value="in_stock">{t('tradeForm.status.inStock')}</option>
              <option value="reserved">{t('tradeForm.status.reserved')}</option>
              <option value="sold">{t('tradeForm.status.sold')}</option>
            </select>
          </div>
        </div>

        {status === 'reserved' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.reserveDate')}</div>
              <input
                type="date"
                value={reserveDate}
                onChange={(e) => setReserveDate(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.salePrice')}</div>
              <input
                type="number"
                value={Number.isFinite(sellPrice) ? sellPrice : 0}
                onChange={(e) => setSellPrice(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.deposit')}</div>
              <input
                type="number"
                value={Number.isFinite(deposit) ? deposit : 0}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>
        ) : status === 'sold' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.saleDate')}</div>
                <input
                  type="date"
                  value={sellDate}
                  onChange={(e) => setSellDate(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
                />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.paymentMethod')}</div>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === 'cash' || v === 'installment' || v === 'barter') setPaymentMethod(v)
                  }}
                  className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
                >
                  <option value="cash">{t('tradeForm.paymentMethods.cash')}</option>
                  <option value="installment">{t('tradeForm.paymentMethods.installment')}</option>
                  <option value="barter">{t('tradeForm.paymentMethods.barter')}</option>
                </select>
              </div>
            </div>

            {paymentMethod === 'cash' ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.salePrice')}</div>
                  <input
                    type="number"
                    value={Number.isFinite(sellPrice) ? sellPrice : 0}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>
            ) : paymentMethod === 'installment' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.salePrice')}</div>
                    <input
                      type="number"
                      value={Number.isFinite(sellPrice) ? sellPrice : 0}
                      onChange={(e) => setSellPrice(Number(e.target.value))}
                      className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.downPayment')}</div>
                    <input
                      type="number"
                      value={Number.isFinite(downPayment) ? downPayment : 0}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                      className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.installmentCount')}</div>
                    <input
                      type="number"
                      value={Number.isFinite(installmentCount) ? installmentCount : 0}
                      onChange={(e) => setInstallmentCount(Number(e.target.value))}
                      className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 px-4 py-3">
                    <div className="text-[11px] font-semibold tracking-wide text-slate-600">{t('tradeForm.fields.remainingBalance')}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{String(installmentRemaining)}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 px-4 py-3">
                    <div className="text-[11px] font-semibold tracking-wide text-slate-600">{t('tradeForm.fields.monthlyAmount')}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{String(installmentMonthly)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.nextPaymentDate')}</div>
                    <input
                      type="date"
                      value={nextPaymentDate}
                      onChange={(e) => setNextPaymentDate(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.barterCash')}</div>
                    <input
                      type="number"
                      value={Number.isFinite(barterCash) ? barterCash : 0}
                      onChange={(e) => setBarterCash(Number(e.target.value))}
                      className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.tradeInValue')}</div>
                    <input
                      type="number"
                      value={Number.isFinite(tradeInValue) ? tradeInValue : 0}
                      onChange={(e) => setTradeInValue(Number(e.target.value))}
                      className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 px-4 py-3">
                    <div className="text-[11px] font-semibold tracking-wide text-slate-600">{t('tradeForm.fields.salePrice')}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{String(barterTotal)}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--tf-border)] bg-white/50 p-4">
                  <div className="text-xs font-semibold text-slate-700">{t('tradeForm.sections.tradeIn')}</div>
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.tradeInBrand')}</div>
                      <input
                        value={tradeInBrand}
                        onChange={(e) => setTradeInBrand(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.tradeInModel')}</div>
                      <input
                        value={tradeInModel}
                        onChange={(e) => setTradeInModel(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.tradeInYear')}</div>
                      <input
                        type="number"
                        value={tradeInYear}
                        onChange={(e) => setTradeInYear(e.target.value === '' ? '' : Number(e.target.value))}
                        className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.tradeInEngine')}</div>
                      <input
                        value={tradeInEngine}
                        onChange={(e) => setTradeInEngine(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--tf-border)] bg-white/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-700">{t('tradeForm.sections.expenses')}</div>
            <Button
              variant="ghost"
              onClick={() => {
                setExpenses((prev) => [
                  ...prev,
                  { id: newId(), date: toIsoDateInputValue(new Date()), description: '', amount: 0 },
                ])
              }}
            >
              {t('tradeForm.actions.addExpense')}
            </Button>
          </div>

          {expenses.length === 0 ? (
            <div className="mt-3 text-xs text-slate-500">{t('tradeForm.emptyExpenses')}</div>
          ) : (
            <div className="mt-3 space-y-3">
              {expenses.map((e) => (
                <div key={e.id} className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <input
                      type="date"
                      value={e.date}
                      onChange={(evt) => {
                        const v = evt.target.value
                        setExpenses((prev) => prev.map((x) => (x.id === e.id ? { ...x, date: v } : x)))
                      }}
                      className="w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div className="md:col-span-6">
                    <input
                      value={e.description}
                      onChange={(evt) => {
                        const v = evt.target.value
                        setExpenses((prev) => prev.map((x) => (x.id === e.id ? { ...x, description: v } : x)))
                      }}
                      placeholder={t('tradeForm.fields.expenseDescPlaceholder')}
                      className="w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      value={Number.isFinite(e.amount) ? e.amount : 0}
                      onChange={(evt) => {
                        const v = Number(evt.target.value)
                        setExpenses((prev) => prev.map((x) => (x.id === e.id ? { ...x, amount: v } : x)))
                      }}
                      className="w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Button
                      variant="ghost"
                      onClick={() => setExpenses((prev) => prev.filter((x) => x.id !== e.id))}
                      className="w-full"
                    >
                      {t('tradeForm.actions.remove')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>

    <Modal
      title={t('tradeForm.addContactTitle')}
      open={contactModalOpen}
      onClose={() => setContactModalOpen(false)}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setContactModalOpen(false)}>
            {t('tradeForm.cancel')}
          </Button>
          <Button
            onClick={() => {
              const now = new Date().toISOString()
              const contact: Contact = {
                id: newId(),
                name: contactName.trim(),
                phone: contactPhone.trim(),
                email: contactEmail.trim(),
                role: contactRole,
                notes: contactNotes.trim(),
                createdAt: now,
                updatedAt: now,
              }
              onUpsertContact(contact)
              if (contactModalTarget === 'seller') setSellerContactId(contact.id)
              else setBuyerContactId(contact.id)
              setContactModalOpen(false)
            }}
            disabled={!canSaveContact}
          >
            {t('tradeForm.save')}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <div>
          <div className="text-xs font-medium text-slate-600">{t('tradeForm.contact.fields.name')}</div>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-slate-600">{t('tradeForm.contact.fields.phone')}</div>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
            />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600">{t('tradeForm.contact.fields.email')}</div>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
            />
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600">{t('tradeForm.contact.fields.role')}</div>
          <select
            value={contactRole}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'buyer' || v === 'seller' || v === 'both') setContactRole(v)
            }}
            className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
          >
            <option value="buyer">{t('customers.roles.buyer')}</option>
            <option value="seller">{t('customers.roles.seller')}</option>
            <option value="both">{t('customers.roles.both')}</option>
          </select>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600">{t('tradeForm.contact.fields.notes')}</div>
          <textarea
            value={contactNotes}
            onChange={(e) => setContactNotes(e.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
          />
        </div>
      </div>
    </Modal>
    </>
  )
}

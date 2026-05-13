import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { addDays, parseIsoDate, toIsoDateInputValue } from '../lib/dates'
import type { TradeItem } from '../lib/types'

function newId(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return String(Date.now())
}

export function TradeFormModal({
  open,
  onClose,
  categories,
  initial,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  categories: string[]
  initial?: TradeItem
  onSubmit: (item: TradeItem) => void
}) {
  const { t } = useTranslation()
  const isEdit = Boolean(initial)

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState<number | ''>('')
  const [engine, setEngine] = useState('')
  const [sellerName, setSellerName] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
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

  useEffect(() => {
    if (!open) return
    if (!initial) {
      setBrand('')
      setModel('')
      setYear('')
      setEngine('')
      setSellerName('')
      setSellerPhone('')
      setBuyerName('')
      setBuyerPhone('')
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
    setSellerName(initial.sellerName ?? '')
    setSellerPhone(initial.sellerPhone ?? '')
    setBuyerName(initial.buyerName ?? '')
    setBuyerPhone(initial.buyerPhone ?? '')
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

  return (
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
                sellerName: sellerName.trim(),
                sellerPhone: sellerPhone.trim(),
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
                  sellerName: buyerName.trim(),
                  sellerPhone: buyerPhone.trim(),
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

        <div className="rounded-2xl border border-[var(--tf-border)] bg-white/50 p-4">
          <div className="text-xs font-semibold text-slate-700">{t('tradeForm.sections.parties')}</div>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.sellerName')}</div>
              <input
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder={t('tradeForm.fields.sellerNamePlaceholder')}
                className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.sellerPhone')}</div>
              <input
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder={t('tradeForm.fields.sellerPhonePlaceholder')}
                className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
              />
            </div>
          </div>

          {status === 'in_stock' ? null : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.buyerName')}</div>
                <input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder={t('tradeForm.fields.buyerNamePlaceholder')}
                  className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
                />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.buyerPhone')}</div>
                <input
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder={t('tradeForm.fields.buyerPhonePlaceholder')}
                  className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.category')}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategoryMode('select')}
                className={[
                  'rounded-2xl border px-3 py-2 text-sm font-medium',
                  categoryMode === 'select'
                    ? 'border-slate-900/20 bg-black/5 text-slate-900'
                    : 'border-[var(--tf-border)] bg-white/60 text-slate-700 hover:bg-black/5',
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
                    ? 'border-slate-900/20 bg-black/5 text-slate-900'
                    : 'border-[var(--tf-border)] bg-white/60 text-slate-700 hover:bg-black/5',
                ].join(' ')}
              >
                {t('tradeForm.fields.categoryCustom')}
              </button>
            </div>

            {categoryMode === 'select' ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
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
  )
}

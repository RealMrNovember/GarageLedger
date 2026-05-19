import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { ModalSection } from '../components/ModalSection'
import { TradeFormAccordion } from '../components/TradeFormAccordion'
import { TradeFormProfitCard } from '../components/TradeFormProfitCard'
import { estimateNetProfit } from '../lib/compute'
import type { CurrencyCode } from '../lib/currency'
import { modalFieldClass, modalLabelClass } from '../lib/uiClasses'
import { addDays, parseIsoDate, toIsoDateInputValue } from '../lib/dates'
import type { Contact, ContactRole, TradeItem } from '../lib/types'
import { decodeVinFromNhtsa, type PowertrainType } from '../lib/vinDecoder'

const fieldClass = modalFieldClass

type VinFlashKey = 'brand' | 'model' | 'year' | 'engine' | 'fuel' | 'powertrain' | 'transmission' | 'vehiclePackage'

function fieldWithVinFlash(base: string, key: VinFlashKey, flash: Set<VinFlashKey>): string {
  return [
    base,
    'mt-2',
    flash.has(key) ? 'ring-2 ring-emerald-500/50 bg-emerald-500/10 transition-all duration-500 dark:bg-emerald-500/15' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

const POWERTRAIN_OPTIONS: PowertrainType[] = ['petrol', 'diesel', 'hybrid', 'phev', 'electric', 'lpg', 'other']

function inferPowertrainFromFuel(fuelText: string): PowertrainType {
  const f = fuelText.toLowerCase()
  if (!f) return ''
  if (f.includes('plug-in') || f.includes('plugin') || f.includes('phev')) return 'phev'
  if (f.includes('hybrid') || f.includes('hev') || f.includes('hibrit')) return 'hybrid'
  if (f.includes('electric') || f.includes('bev') || f.includes('elektrik')) return 'electric'
  if (f.includes('diesel') || f.includes('dizel')) return 'diesel'
  if (f.includes('lpg') || f.includes('cng')) return 'lpg'
  if (f.includes('gasoline') || f.includes('petrol') || f.includes('benzin') || f.includes('gas')) return 'petrol'
  return ''
}

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
  currency = 'AZN',
  onSubmit,
  onUpsertContact,
}: {
  open: boolean
  onClose: () => void
  categories: string[]
  contacts: Contact[]
  initial?: TradeItem
  currency?: CurrencyCode
  onSubmit: (item: TradeItem) => void
  onUpsertContact: (contact: Contact) => void
}) {
  const { t } = useTranslation()
  const isEdit = Boolean(initial)

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState<number | ''>('')
  const [engine, setEngine] = useState('')
  const [plate, setPlate] = useState('')
  const [vehiclePackage, setVehiclePackage] = useState('')
  const [powertrain, setPowertrain] = useState<PowertrainType>('')
  const [fuel, setFuel] = useState('')
  const [transmission, setTransmission] = useState('')
  const [mileage, setMileage] = useState<number | ''>('')
  const [color, setColor] = useState('')
  const [damage, setDamage] = useState('')
  const [tramer, setTramer] = useState('')
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState('')
  const [keyCount, setKeyCount] = useState<number | ''>('')
  const [inspection, setInspection] = useState('')
  const [tax, setTax] = useState<number | ''>('')
  const [commission, setCommission] = useState<number | ''>('')
  const [optionalOpen, setOptionalOpen] = useState(false)
  const [vin, setVin] = useState('')
  const [vinLoading, setVinLoading] = useState(false)
  const [vinToast, setVinToast] = useState<string | null>(null)
  const [vinToastOk, setVinToastOk] = useState(false)
  const [vinFlashFields, setVinFlashFields] = useState<Set<VinFlashKey>>(() => new Set())
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
      setPlate('')
      setVehiclePackage('')
      setPowertrain('')
      setFuel('')
      setTransmission('')
      setMileage('')
      setColor('')
      setDamage('')
      setTramer('')
      setNotes('')
      setLocation('')
      setKeyCount('')
      setInspection('')
      setTax('')
      setCommission('')
      setOptionalOpen(false)
      setVin('')
      setVinLoading(false)
      setVinToast(null)
      setVinToastOk(false)
      setVinFlashFields(new Set())
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
    setPlate(initial.plate ?? '')
    setVehiclePackage(initial.package ?? '')
    const pt = (initial.powertrain as PowertrainType) || inferPowertrainFromFuel(initial.fuel ?? '')
    setPowertrain(POWERTRAIN_OPTIONS.includes(pt) ? pt : inferPowertrainFromFuel(initial.fuel ?? ''))
    setFuel(initial.fuel ?? '')
    setTransmission(initial.transmission ?? '')
    setMileage(initial.mileage ?? '')
    setColor(initial.color ?? '')
    setDamage(initial.damage ?? '')
    setTramer(initial.tramer ?? '')
    setNotes(initial.notes ?? '')
    setLocation(initial.location ?? '')
    setKeyCount(initial.keyCount ?? '')
    setInspection(initial.inspection ?? '')
    setTax(initial.tax ?? '')
    setCommission(initial.commission ?? '')
    setOptionalOpen(
      Boolean(
        initial.plate ||
          initial.package ||
          initial.powertrain ||
          initial.fuel ||
          initial.transmission ||
          initial.mileage ||
          initial.color ||
          initial.damage ||
          initial.tramer ||
          initial.notes ||
          initial.location ||
          initial.keyCount != null ||
          initial.inspection ||
          initial.tax ||
          initial.commission,
      ),
    )
    setVin(initial.vin ?? '')
    setVinLoading(false)
    setVinToast(null)
    setVinToastOk(false)
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

  const canSubmitBase = brand.trim().length > 0 && purchaseDate.trim().length > 0
  const installmentRemaining = useMemo(() => Math.max(0, Number(sellPrice) - Number(downPayment || 0)), [sellPrice, downPayment])
  const installmentMonthly = useMemo(() => {
    const c = Number(installmentCount || 0)
    if (!Number.isFinite(c) || c <= 0) return 0
    return installmentRemaining / c
  }, [installmentRemaining, installmentCount])
  const barterTotal = useMemo(() => Number(barterCash || 0) + Number(tradeInValue || 0), [barterCash, tradeInValue])
  const estimatedProfit = useMemo(
    () =>
      estimateNetProfit({
        status,
        purchasePrice: Number(purchasePrice) || 0,
        sellPrice: status === 'reserved' || status === 'sold' ? Number(sellPrice) : null,
        expenses,
        tax: tax === '' ? 0 : Number(tax),
        commission: commission === '' ? 0 : Number(commission),
        paymentMethod,
        barterTotal,
      }),
    [status, purchasePrice, sellPrice, expenses, tax, commission, paymentMethod, barterTotal],
  )
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
    setVinToastOk(false)
    setVinToast(t(key))
    window.setTimeout(() => {
      setVinToast(null)
      setVinToastOk(false)
    }, 2800)
  }

  const decodeVin = async () => {
    const v = vin.trim().toUpperCase()
    if (v.length < 11) {
      showVinToast('vinDecoder.invalid')
      return
    }
    setVin(v)
    setVinToast(null)
    setVinToastOk(false)
    setVinLoading(true)
    try {
      const ctrl = new AbortController()
      const timeout = window.setTimeout(() => ctrl.abort(), 12000)
      const decoded = await decodeVinFromNhtsa(v, ctrl.signal)
      window.clearTimeout(timeout)
      if (!decoded) {
        showVinToast('vinDecoder.notFound')
        return
      }

      const flash = new Set<VinFlashKey>()
      if (decoded.brand) {
        setBrand(decoded.brand)
        flash.add('brand')
      }
      if (decoded.model) {
        setModel(decoded.model)
        flash.add('model')
      }
      if (decoded.year != null) {
        setYear(decoded.year)
        flash.add('year')
      }
      if (decoded.engine) {
        setEngine(decoded.engine)
        flash.add('engine')
      }
      if (decoded.fuel) {
        setFuel(decoded.fuel)
        flash.add('fuel')
      }
      if (decoded.powertrain) {
        setPowertrain(decoded.powertrain)
        flash.add('powertrain')
      }
      if (decoded.transmission) {
        setTransmission(decoded.transmission)
        flash.add('transmission')
      }
      if (decoded.vehiclePackage) {
        setVehiclePackage(decoded.vehiclePackage)
        flash.add('vehiclePackage')
      }

      setVinFlashFields(flash)
      window.setTimeout(() => setVinFlashFields(new Set()), 1600)

      if (decoded.powertrain || decoded.fuel || decoded.transmission || decoded.vehiclePackage) {
        setOptionalOpen(true)
      }

      setVinToastOk(true)
      setVinToast(t('vinDecoder.success', { count: decoded.filledCount }))
      window.setTimeout(() => {
        setVinToast(null)
        setVinToastOk(false)
      }, 3200)
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
        size="workspace"
        draggable
        maximizable
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
                package: vehiclePackage.trim() || undefined,
                powertrain: powertrain || undefined,
                fuel: fuel.trim() || undefined,
                transmission: transmission.trim() || undefined,
                mileage: mileage === '' ? null : Number(mileage),
                color: color.trim() || undefined,
                damage: damage.trim() || undefined,
                tramer: tramer.trim() || undefined,
                notes: notes.trim() || undefined,
                location: location.trim() || undefined,
                plate: plate.trim() || undefined,
                keyCount: keyCount === '' ? null : Number(keyCount),
                inspection: inspection.trim() || undefined,
                tax: tax === '' ? null : Number(tax),
                commission: commission === '' ? null : Number(commission),
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
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-start">
        <div className="space-y-5 xl:col-span-8">
        <section
          aria-label={t('vinDecoder.heroTitle')}
          className="rounded-2xl border border-blue-500/20 bg-slate-900/[0.03] p-4 ring-1 ring-blue-500/30 dark:border-blue-400/25 dark:bg-neutral-800/50 sm:p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 ring-1 ring-blue-500/25 dark:text-blue-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                </span>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-[var(--tf-ink)]">{t('vinDecoder.heroTitle')}</h3>
                  <p className="mt-0.5 text-xs text-[var(--tf-ink-muted)]">{t('vinDecoder.heroHint')}</p>
                </div>
              </div>
              {vinToast ? (
                <p
                  className={[
                    'text-xs font-medium',
                    vinToastOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                  ].join(' ')}
                  role="status"
                >
                  {vinToast}
                </p>
              ) : null}
              <label htmlFor="trade-vin-hero" className="sr-only">
                {t('vinDecoder.vinLabel')}
              </label>
              <input
                id="trade-vin-hero"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void decodeVin()
                  }
                }}
                placeholder={t('vinDecoder.vinPlaceholder')}
                autoComplete="off"
                spellCheck={false}
                className={[
                  fieldClass,
                  'mt-0 h-12 font-mono text-base tracking-wider uppercase',
                  'border-blue-500/25 bg-white/80 dark:bg-neutral-900/60',
                  'focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/25',
                ].join(' ')}
              />
            </div>
            <button
              type="button"
              onClick={() => void decodeVin()}
              disabled={vinLoading || vin.trim().length < 11}
              className={[
                'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white transition-all duration-200',
                'bg-blue-600 shadow-lg shadow-blue-600/25 hover:bg-blue-500',
                'disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none',
                'lg:min-w-[200px]',
              ].join(' ')}
            >
              {vinLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t('vinDecoder.loading')}
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 14v4h4M20 10V6h-4M5 19l4-4M19 5l-4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {t('vinDecoder.fetch')}
                </>
              )}
            </button>
          </div>
        </section>
        <div className="relative flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-[var(--tf-border)]" />
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--tf-ink-muted)]">
            {t('vinDecoder.manualDivider')}
          </span>
          <div className="h-px flex-1 bg-[var(--tf-border)]" />
        </div>
        <ModalSection title={t('tradeForm.sections.basic')}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 sm:col-span-6">
            <div className={modalLabelClass}>{t('tradeForm.fields.brand')}</div>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={t('tradeForm.fields.brandPlaceholder')}
              className={fieldWithVinFlash(fieldClass, 'brand', vinFlashFields)}
            />
          </div>

          <div className="col-span-12 sm:col-span-6">
            <div className={modalLabelClass}>{t('tradeForm.fields.model')}</div>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t('tradeForm.fields.modelPlaceholder')}
              className={fieldWithVinFlash(fieldClass, 'model', vinFlashFields)}
            />
          </div>

          <div className="col-span-12 sm:col-span-4">
            <div className={modalLabelClass}>{t('tradeForm.fields.year')}</div>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={t('tradeForm.fields.yearPlaceholder')}
              className={fieldWithVinFlash(fieldClass, 'year', vinFlashFields)}
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <div className={modalLabelClass}>{t('tradeForm.fields.engine')}</div>
            <input
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              placeholder={t('tradeForm.fields.enginePlaceholder')}
              className={fieldWithVinFlash(fieldClass, 'engine', vinFlashFields)}
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <div className={modalLabelClass}>{t('tradeForm.fields.plate')}</div>
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder={t('tradeForm.fields.platePlaceholder')}
              className={`${fieldClass} mt-2`}
            />
          </div>

          <div className="col-span-12 sm:col-span-6">
            <div className={modalLabelClass}>{t('tradeForm.fields.fuel')}</div>
            <input
              value={fuel}
              onChange={(e) => setFuel(e.target.value)}
              placeholder={t('tradeForm.fields.fuelDetail')}
              className={fieldWithVinFlash(fieldClass, 'fuel', vinFlashFields)}
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <div className={modalLabelClass}>{t('tradeForm.fields.transmission')}</div>
            <input
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
              className={fieldWithVinFlash(fieldClass, 'transmission', vinFlashFields)}
            />
          </div>
        </div>
        </ModalSection>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ModalSection title={t('tradeForm.sections.parties')}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        </ModalSection>

        <ModalSection title={t('tradeForm.sections.finance')}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className={modalLabelClass}>{t('tradeForm.fields.category')}</div>
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
            <div className={modalLabelClass}>{t('tradeForm.fields.purchasePrice')}</div>
            <input
              type="number"
              value={Number.isFinite(purchasePrice) ? purchasePrice : 0}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className={`${fieldClass} mt-2`}
            />
          </div>
        </div>
        </ModalSection>
        </div>

        <ModalSection title={t('tradeForm.sections.status')}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className={modalLabelClass}>{t('tradeForm.fields.status')}</div>
            <select
              value={status}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'in_stock' || v === 'reserved' || v === 'sold') setStatus(v)
              }}
              className={`${fieldClass} mt-2`}
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
        </ModalSection>

        <TradeFormAccordion
          title={t('tradeForm.sections.optional')}
          description={t('tradeForm.optional.subtitle')}
          open={optionalOpen}
          onToggle={() => setOptionalOpen((v) => !v)}
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 sm:col-span-6">
              <div className={modalLabelClass}>{t('tradeForm.fields.package')}</div>
              <input value={vehiclePackage} onChange={(e) => setVehiclePackage(e.target.value)} className={fieldWithVinFlash(fieldClass, 'vehiclePackage', vinFlashFields)} />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className={modalLabelClass}>{t('tradeForm.fields.powertrain')}</div>
              <select
                value={powertrain}
                onChange={(e) => setPowertrain(e.target.value as PowertrainType)}
                className={fieldWithVinFlash(fieldClass, 'powertrain', vinFlashFields)}
              >
                <option value="">—</option>
                {POWERTRAIN_OPTIONS.map((pt) => (
                  <option key={pt} value={pt}>
                    {t(`tradeForm.powertrain.${pt}`)}
                  </option>
                ))}
              </select>
            </div>
<div className="col-span-12 sm:col-span-6">
              <div className={modalLabelClass}>{t('tradeForm.fields.mileage')}</div>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value === '' ? '' : Number(e.target.value))}
                className={`${fieldClass} mt-2`}
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className={modalLabelClass}>{t('tradeForm.fields.color')}</div>
              <input value={color} onChange={(e) => setColor(e.target.value)} className={`${fieldClass} mt-2`} />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className={modalLabelClass}>{t('tradeForm.fields.location')}</div>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className={`${fieldClass} mt-2`} />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className={modalLabelClass}>{t('tradeForm.fields.tax')}</div>
              <input
                type="number"
                value={tax}
                onChange={(e) => setTax(e.target.value === '' ? '' : Number(e.target.value))}
                className={`${fieldClass} mt-2`}
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className={modalLabelClass}>{t('tradeForm.fields.commission')}</div>
              <input
                type="number"
                value={commission}
                onChange={(e) => setCommission(e.target.value === '' ? '' : Number(e.target.value))}
                className={`${fieldClass} mt-2`}
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className={modalLabelClass}>{t('tradeForm.fields.keyCount')}</div>
              <input
                type="number"
                value={keyCount}
                onChange={(e) => setKeyCount(e.target.value === '' ? '' : Number(e.target.value))}
                className={`${fieldClass} mt-2`}
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <div className={modalLabelClass}>{t('tradeForm.fields.inspection')}</div>
              <input value={inspection} onChange={(e) => setInspection(e.target.value)} className={`${fieldClass} mt-2`} />
            </div>
            <div className="col-span-12">
              <div className={modalLabelClass}>{t('tradeForm.fields.damage')}</div>
              <input value={damage} onChange={(e) => setDamage(e.target.value)} className={`${fieldClass} mt-2`} />
            </div>
            <div className="col-span-12">
              <div className={modalLabelClass}>{t('tradeForm.fields.tramer')}</div>
              <input value={tramer} onChange={(e) => setTramer(e.target.value)} className={`${fieldClass} mt-2`} />
            </div>
            <div className="col-span-12">
              <div className={modalLabelClass}>{t('tradeForm.fields.notes')}</div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${fieldClass} mt-2 resize-none`} />
            </div>
          </div>
        </TradeFormAccordion>

        <ModalSection
          title={t('tradeForm.sections.expenses')}
          actions={
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
          }
        >
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
        </ModalSection>
        </div>
        <div className="xl:col-span-4">
          <div className="xl:sticky xl:top-2">
            <TradeFormProfitCard profit={estimatedProfit} currency={currency} status={status} />
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      title={t('tradeForm.addContactTitle')}
      open={contactModalOpen}
      onClose={() => setContactModalOpen(false)}
      size="md"
      draggable
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

import type { CurrencyCode } from './currency'
import type { Contact, ContactRole, GarageLedgerSettings, TradeItem } from './types'

type StoredData = {
  items: TradeItem[]
  contacts: Contact[]
  settings: GarageLedgerSettings
}

const STORAGE_KEY_V1 = 'garageledger.data.v1'
const STORAGE_KEY_V2 = 'garageledger.data.v2'

function migrateItem(raw: unknown): TradeItem | null {
  if (!raw || typeof raw !== 'object') return null
  const anyItem = raw as Record<string, unknown>

  const brand = (anyItem.brand ?? anyItem.title ?? anyItem.carModel) as string | undefined
  const model = anyItem.model as string | undefined
  const yearRaw = anyItem.year as number | string | undefined
  const engine = anyItem.engine as string | undefined
  const vin = (anyItem.vin ?? (anyItem as Record<string, unknown>).VIN ?? anyItem.chassisNo ?? anyItem.chassis) as string | undefined

  const expensesRaw = anyItem.expenses
  const expenses = Array.isArray(expensesRaw)
    ? expensesRaw
        .map((e) => {
          if (!e || typeof e !== 'object') return null
          const r = e as Record<string, unknown>
          const id = String(r.id ?? '')
          if (!id) return null
          const date = String(r.date ?? '')
          const description = String(r.description ?? '')
          const amount = Number(r.amount ?? 0)
          return { id, date, description, amount: Number.isFinite(amount) ? amount : 0 }
        })
        .filter((x): x is NonNullable<typeof x> => x != null)
    : []

  const sellDate = (anyItem.sellDate ?? anyItem.saleDate) as string | null | undefined
  const sellPrice = (anyItem.sellPrice ?? anyItem.salePrice) as number | null | undefined
  const statusRaw = anyItem.status as string | undefined
  const status =
    statusRaw === 'sold' || (sellDate && sellPrice != null) ? 'sold' : statusRaw === 'reserved' ? 'reserved' : 'in_stock'
  const year =
    yearRaw == null ? null : Number.isFinite(Number(yearRaw)) ? Number(yearRaw) : null

  const reserveDate = (anyItem.reserveDate as string | null | undefined) ?? null
  const depositRaw = anyItem.deposit as number | null | undefined
  const deposit = depositRaw == null ? null : Number(depositRaw)
  const paymentMethodRaw = anyItem.paymentMethod as string | undefined
  const paymentMethod =
    paymentMethodRaw === 'cash' || paymentMethodRaw === 'installment' || paymentMethodRaw === 'barter'
      ? paymentMethodRaw
      : 'cash'
  const downPaymentRaw = anyItem.downPayment as number | null | undefined
  const downPayment = downPaymentRaw == null ? null : Number(downPaymentRaw)
  const installmentCountRaw = anyItem.installmentCount as number | null | undefined
  const installmentCount = installmentCountRaw == null ? null : Number(installmentCountRaw)
  const remainingBalanceRaw = anyItem.remainingBalance as number | null | undefined
  const remainingBalance = remainingBalanceRaw == null ? null : Number(remainingBalanceRaw)
  const nextPaymentDate = (anyItem.nextPaymentDate as string | null | undefined) ?? null
  const barterCashRaw = anyItem.barterCash as number | null | undefined
  const barterCash = barterCashRaw == null ? null : Number(barterCashRaw)
  const tradeInRaw = anyItem.tradeIn as Record<string, unknown> | null | undefined
  const tradeIn =
    tradeInRaw && typeof tradeInRaw === 'object'
      ? {
          brand: String(tradeInRaw.brand ?? ''),
          model: String(tradeInRaw.model ?? ''),
          year: tradeInRaw.year == null ? null : Number(tradeInRaw.year),
          engine: String(tradeInRaw.engine ?? ''),
          value: Number(tradeInRaw.value ?? 0),
        }
      : null
  const sellerContactId = (anyItem.sellerContactId as string | null | undefined) ?? null
  const sellerName = (anyItem.sellerName as string | undefined) ?? ''
  const sellerPhone = (anyItem.sellerPhone as string | undefined) ?? ''
  const buyerContactId = (anyItem.buyerContactId as string | null | undefined) ?? null
  const buyerName = (anyItem.buyerName as string | undefined) ?? ''
  const buyerPhone = (anyItem.buyerPhone as string | undefined) ?? ''

  return {
    id: String(anyItem.id ?? ''),
    brand: String(brand ?? ''),
    model: String(model ?? ''),
    year,
    engine: String(engine ?? ''),
    vin: String(vin ?? ''),
    category: String(anyItem.category ?? 'Diğer'),
    purchaseDate: String(anyItem.purchaseDate ?? ''),
    purchasePrice: Number(anyItem.purchasePrice ?? 0),
    status,
    reserveDate: reserveDate ? String(reserveDate) : null,
    deposit: deposit == null || !Number.isFinite(deposit) ? null : deposit,
    paymentMethod,
    downPayment: downPayment == null || !Number.isFinite(downPayment) ? null : downPayment,
    installmentCount: installmentCount == null || !Number.isFinite(installmentCount) ? null : installmentCount,
    remainingBalance:
      remainingBalance == null || !Number.isFinite(remainingBalance) ? (status === 'sold' ? 0 : null) : remainingBalance,
    nextPaymentDate: nextPaymentDate ? String(nextPaymentDate) : null,
    barterCash: barterCash == null || !Number.isFinite(barterCash) ? null : barterCash,
    tradeIn:
      tradeIn && Number.isFinite(tradeIn.value)
        ? { ...tradeIn, year: Number.isFinite(tradeIn.year) ? tradeIn.year : null, value: tradeIn.value }
        : null,
    sellerContactId: sellerContactId ? String(sellerContactId) : null,
    sellerName: String(sellerName ?? ''),
    sellerPhone: String(sellerPhone ?? ''),
    buyerContactId: buyerContactId ? String(buyerContactId) : null,
    buyerName: String(buyerName ?? ''),
    buyerPhone: String(buyerPhone ?? ''),
    sellDate: sellDate ? String(sellDate) : null,
    sellPrice: sellPrice == null ? null : Number(sellPrice),
    expenses,
  }
}

function migrateContact(raw: unknown): Contact | null {
  if (!raw || typeof raw !== 'object') return null
  const any = raw as Record<string, unknown>
  const id = String(any.id ?? '')
  if (!id) return null
  const roleRaw = any.role as string | undefined
  const role: ContactRole = roleRaw === 'buyer' || roleRaw === 'seller' || roleRaw === 'both' ? roleRaw : 'both'
  const createdAt = String(any.createdAt ?? new Date().toISOString())
  const updatedAt = String(any.updatedAt ?? createdAt)
  return {
    id,
    name: String(any.name ?? ''),
    phone: String(any.phone ?? ''),
    email: String(any.email ?? ''),
    role,
    notes: String(any.notes ?? ''),
    createdAt,
    updatedAt,
  }
}

function isTradeItem(v: TradeItem | null): v is TradeItem {
  return v != null
}

function isContact(v: Contact | null): v is Contact {
  return v != null
}

function readLocal(): StoredData {
  const raw = localStorage.getItem(STORAGE_KEY_V2)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StoredData
      return {
        items: Array.isArray(parsed.items) ? parsed.items.map(migrateItem).filter(isTradeItem) : [],
        contacts: Array.isArray(parsed.contacts) ? parsed.contacts.map(migrateContact).filter(isContact) : [],
        settings: parsed.settings ?? { currency: 'AZN' },
      }
    } catch {
      return { items: [], contacts: [], settings: { currency: 'AZN' } }
    }
  }

  const rawV1 = localStorage.getItem(STORAGE_KEY_V1)
  if (!rawV1) return { items: [], contacts: [], settings: { currency: 'AZN' } }
  try {
    const parsed = JSON.parse(rawV1) as { items?: unknown[]; settings?: GarageLedgerSettings }
    const migrated: StoredData = {
      items: Array.isArray(parsed.items) ? parsed.items.map(migrateItem).filter(isTradeItem) : [],
      contacts: [],
      settings: parsed.settings ?? { currency: 'AZN' },
    }
    writeLocal(migrated)
    localStorage.removeItem(STORAGE_KEY_V1)
    return migrated
  } catch {
    return { items: [], contacts: [], settings: { currency: 'AZN' } }
  }
}

function writeLocal(data: StoredData) {
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data))
}

export const api = {
  async listItems(): Promise<TradeItem[]> {
    if (window.GarageLedger) return window.GarageLedger.items.list()
    return readLocal().items
  },
  async listContacts(): Promise<Contact[]> {
    if (window.GarageLedger) return window.GarageLedger.contacts.list()
    return readLocal().contacts
  },
  async upsertItem(item: TradeItem): Promise<TradeItem[]> {
    if (window.GarageLedger) return window.GarageLedger.items.upsert(item)
    const data = readLocal()
    const idx = data.items.findIndex((x) => x.id === item.id)
    if (idx >= 0) data.items[idx] = item
    else data.items.unshift(item)
    writeLocal(data)
    return data.items
  },
  async upsertContact(contact: Contact): Promise<Contact[]> {
    if (window.GarageLedger) return window.GarageLedger.contacts.upsert(contact)
    const data = readLocal()
    const idx = data.contacts.findIndex((x) => x.id === contact.id)
    if (idx >= 0) data.contacts[idx] = contact
    else data.contacts.unshift(contact)
    writeLocal(data)
    return data.contacts
  },
  async removeItem(id: string): Promise<TradeItem[]> {
    if (window.GarageLedger) return window.GarageLedger.items.remove(id)
    const data = readLocal()
    data.items = data.items.filter((x) => x.id !== id)
    writeLocal(data)
    return data.items
  },
  async removeContact(id: string): Promise<Contact[]> {
    if (window.GarageLedger) return window.GarageLedger.contacts.remove(id)
    const data = readLocal()
    data.contacts = data.contacts.filter((x) => x.id !== id)
    writeLocal(data)
    return data.contacts
  },
  async getSettings(): Promise<GarageLedgerSettings> {
    if (window.GarageLedger) return window.GarageLedger.settings.get()
    return readLocal().settings
  },
  async setCurrency(currency: CurrencyCode): Promise<GarageLedgerSettings> {
    if (window.GarageLedger) return window.GarageLedger.settings.setCurrency(currency)
    const data = readLocal()
    data.settings.currency = currency
    writeLocal(data)
    return data.settings
  },
  async updateSettings(patch: Partial<GarageLedgerSettings>): Promise<GarageLedgerSettings> {
    if (window.GarageLedger) return window.GarageLedger.settings.update(patch)
    const data = readLocal()
    data.settings = { ...data.settings, ...patch }
    if (patch.companyProfile) data.settings.companyProfile = { ...(data.settings.companyProfile ?? {}), ...patch.companyProfile }
    if (patch.appLock) data.settings.appLock = { ...(data.settings.appLock ?? { enabled: false, passwordSalt: null, passwordHash: null }), ...patch.appLock }
    writeLocal(data)
    return data.settings
  },
}

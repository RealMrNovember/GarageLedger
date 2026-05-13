import type { CurrencyCode } from './currency'
import type { GarageLedgerSettings, TradeItem } from './types'

type StoredData = {
  items: TradeItem[]
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
  const sellerName = (anyItem.sellerName as string | undefined) ?? ''
  const sellerPhone = (anyItem.sellerPhone as string | undefined) ?? ''
  const buyerName = (anyItem.buyerName as string | undefined) ?? ''
  const buyerPhone = (anyItem.buyerPhone as string | undefined) ?? ''

  return {
    id: String(anyItem.id ?? ''),
    brand: String(brand ?? ''),
    model: String(model ?? ''),
    year,
    engine: String(engine ?? ''),
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
    sellerName: String(sellerName ?? ''),
    sellerPhone: String(sellerPhone ?? ''),
    buyerName: String(buyerName ?? ''),
    buyerPhone: String(buyerPhone ?? ''),
    sellDate: sellDate ? String(sellDate) : null,
    sellPrice: sellPrice == null ? null : Number(sellPrice),
    expenses,
  }
}

function isTradeItem(v: TradeItem | null): v is TradeItem {
  return v != null
}

function readLocal(): StoredData {
  const raw = localStorage.getItem(STORAGE_KEY_V2)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StoredData
      return {
        items: Array.isArray(parsed.items) ? parsed.items.map(migrateItem).filter(isTradeItem) : [],
        settings: parsed.settings ?? { currency: 'AZN' },
      }
    } catch {
      return { items: [], settings: { currency: 'AZN' } }
    }
  }

  const rawV1 = localStorage.getItem(STORAGE_KEY_V1)
  if (!rawV1) return { items: [], settings: { currency: 'AZN' } }
  try {
    const parsed = JSON.parse(rawV1) as { items?: unknown[]; settings?: GarageLedgerSettings }
    const migrated: StoredData = {
      items: Array.isArray(parsed.items) ? parsed.items.map(migrateItem).filter(isTradeItem) : [],
      settings: parsed.settings ?? { currency: 'AZN' },
    }
    writeLocal(migrated)
    localStorage.removeItem(STORAGE_KEY_V1)
    return migrated
  } catch {
    return { items: [], settings: { currency: 'AZN' } }
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
  async upsertItem(item: TradeItem): Promise<TradeItem[]> {
    if (window.GarageLedger) return window.GarageLedger.items.upsert(item)
    const data = readLocal()
    const idx = data.items.findIndex((x) => x.id === item.id)
    if (idx >= 0) data.items[idx] = item
    else data.items.unshift(item)
    writeLocal(data)
    return data.items
  },
  async removeItem(id: string): Promise<TradeItem[]> {
    if (window.GarageLedger) return window.GarageLedger.items.remove(id)
    const data = readLocal()
    data.items = data.items.filter((x) => x.id !== id)
    writeLocal(data)
    return data.items
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
}

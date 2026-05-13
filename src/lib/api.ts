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

  const sellDate = (anyItem.sellDate ?? anyItem.saleDate) as string | null | undefined
  const sellPrice = (anyItem.sellPrice ?? anyItem.salePrice) as number | null | undefined
  const statusRaw = anyItem.status as string | undefined
  const status = statusRaw === 'sold' || (sellDate && sellPrice != null) ? 'sold' : 'in_stock'

  return {
    id: String(anyItem.id ?? ''),
    title: String(anyItem.title ?? ''),
    category: String(anyItem.category ?? 'Diğer'),
    purchaseDate: String(anyItem.purchaseDate ?? ''),
    purchasePrice: Number(anyItem.purchasePrice ?? 0),
    status,
    sellDate: sellDate ? String(sellDate) : null,
    sellPrice: sellPrice == null ? null : Number(sellPrice),
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

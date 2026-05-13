import type { CurrencyCode } from './currency'
import type { GarageLedgerSettings, TradeItem } from './types'

type StoredData = {
  items: TradeItem[]
  settings: GarageLedgerSettings
}

const STORAGE_KEY = 'garageledger.data.v1'

function readLocal(): StoredData {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { items: [], settings: { currency: 'AZN' } }
  try {
    return JSON.parse(raw) as StoredData
  } catch {
    return { items: [], settings: { currency: 'AZN' } }
  }
}

function writeLocal(data: StoredData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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

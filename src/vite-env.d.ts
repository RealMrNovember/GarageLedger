/// <reference types="vite/client" />

type CurrencyCode = 'AZN' | 'USD' | 'EUR'

type TradeItem = {
  id: string
  brand: string
  model: string
  year: number | null
  engine: string
  category: string
  purchaseDate: string
  status: 'in_stock' | 'sold'
  sellDate: string | null
  purchasePrice: number
  sellPrice: number | null
}

type GarageLedgerSettings = {
  currency: CurrencyCode
  lastBackupAt?: string | null
  lastUpdateCheckAt?: string | null
}

type GarageLedgerApi = {
  items: {
    list: () => Promise<TradeItem[]>
    upsert: (item: TradeItem) => Promise<TradeItem[]>
    remove: (id: string) => Promise<TradeItem[]>
  }
  settings: {
    get: () => Promise<GarageLedgerSettings>
    setCurrency: (currency: CurrencyCode) => Promise<GarageLedgerSettings>
  }
  app: {
    getInfo: () => Promise<{ version: string; name: string; isPackaged: boolean }>
  }
  updates: {
    getStatus: () => Promise<unknown>
    check: () => Promise<{ ok: boolean }>
    install: () => Promise<{ ok: boolean }>
    onStatus: (handler: (payload: unknown) => void) => () => void
  }
  backups: {
    ensureDaily: () => Promise<{ ok: boolean; created?: { fileName: string; fullPath: string } | null; message?: string }>
    create: () => Promise<{ ok: boolean; created?: { fileName: string; fullPath: string }; message?: string }>
    list: () => Promise<{
      ok: boolean
      items: { fileName: string; fullPath: string; size: number; mtimeMs: number }[]
      message?: string
    }>
    openFolder: () => Promise<{ ok: boolean; message?: string }>
    restore: (fileName: string) => Promise<{ ok: boolean; result?: unknown; message?: string }>
  }
}

interface Window {
  GarageLedger?: GarageLedgerApi
}

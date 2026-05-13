/// <reference types="vite/client" />

type CurrencyCode = 'AZN' | 'USD' | 'EUR'

type TradeItem = {
  id: string
  title: string
  category: string
  purchaseDate: string
  saleDate: string | null
  purchasePrice: number
  salePrice: number | null
}

type GarageLedgerSettings = {
  currency: CurrencyCode
  lastBackupAt?: string | null
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

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
    check: () => Promise<{ ok: boolean }>
    install: () => Promise<{ ok: boolean }>
    onStatus: (handler: (payload: unknown) => void) => () => void
  }
}

interface Window {
  GarageLedger?: GarageLedgerApi
}

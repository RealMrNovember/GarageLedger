/// <reference types="vite/client" />

type CurrencyCode = 'AZN' | 'USD' | 'EUR' | 'TRY'

type TradeItem = {
  id: string
  brand: string
  model: string
  year: number | null
  engine: string
  category: string
  purchaseDate: string
  status: 'in_stock' | 'reserved' | 'sold'
  reserveDate: string | null
  deposit: number | null
  paymentMethod: 'cash' | 'installment' | 'barter'
  downPayment: number | null
  installmentCount: number | null
  remainingBalance: number | null
  nextPaymentDate: string | null
  barterCash: number | null
  tradeIn:
    | {
        brand: string
        model: string
        year: number | null
        engine: string
        value: number
      }
    | null
  sellerContactId: string | null
  sellerName: string
  sellerPhone: string
  buyerContactId: string | null
  buyerName: string
  buyerPhone: string
  sellDate: string | null
  purchasePrice: number
  sellPrice: number | null
  expenses: {
    id: string
    date: string
    description: string
    amount: number
  }[]
}

type ContactRole = 'buyer' | 'seller' | 'both'

type Contact = {
  id: string
  name: string
  phone: string
  email: string
  role: ContactRole
  notes: string
  createdAt: string
  updatedAt: string
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
  contacts: {
    list: () => Promise<Contact[]>
    upsert: (contact: Contact) => Promise<Contact[]>
    remove: (id: string) => Promise<Contact[]>
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
    download: () => Promise<{ ok: boolean }>
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

/// <reference types="vite/client" />

type CurrencyCode = 'AZN' | 'USD' | 'EUR' | 'TRY'

type TradeItem = {
  id: string
  brand: string
  model: string
  package?: string
  year: number | null
  engine: string
  powertrain?: string
  fuel?: string
  transmission?: string
  mileage?: number | null
  color?: string
  damage?: string
  tramer?: string
  notes?: string
  location?: string
  plate?: string
  keyCount?: number | null
  inspection?: string
  vin: string
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
  tax?: number | null
  commission?: number | null
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
  reminders?: {
    enabled: boolean
    notifyHour: number
    daysBefore: number
  }
  fxUpdates?: {
    provider: 'exchangerate-api'
    mode: 'manual' | '15m' | '30m' | '1h'
  }
  backupSettings?: {
    schedule: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'manual'
    keepLast: number
  }
  companyProfile?: {
    name?: string
    logoDataUrl?: string
    address?: string
    phone?: string
    email?: string
    website?: string
  }
  appLock?: {
    enabled: boolean
    passwordSalt: string | null
    passwordHash: string | null
    supportCode?: string | null
  }
}

type GarageLedgerApi = {
  bootstrap?: {
    getInitialData: () => Promise<{ ok: boolean; message?: string; items?: TradeItem[]; contacts?: Contact[]; settings?: GarageLedgerSettings }>
  }
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
    update: (patch: Partial<GarageLedgerSettings>) => Promise<GarageLedgerSettings>
  }
  app: {
    getInfo: () => Promise<{ version: string; name: string; isPackaged: boolean }>
  }
  pdf: {
    getFont: () => Promise<{ ok: boolean; fileName?: string; base64?: string }>
  }
  whatsNew: {
    getLatestPhase: () => Promise<{ ok: boolean; title?: string; bullets?: string[] }>
    getHistory: () => Promise<{
      ok: boolean
      releases?: Array<{ version: string; date?: string; phases?: Array<{ title: string; bullets: string[] }> }>
    }>
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
    cleanup: (keepLast?: number) => Promise<{ ok: boolean; result?: { deleted: number; kept: number }; message?: string }>
    restore: (fileName: string) => Promise<{ ok: boolean; result?: unknown; message?: string }>
  }
}

interface Window {
  GarageLedger?: GarageLedgerApi
}

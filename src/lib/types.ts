import type { CurrencyCode } from './currency'

export type ContactRole = 'buyer' | 'seller' | 'both'

export type Contact = {
  id: string
  name: string
  phone: string
  email: string
  role: ContactRole
  notes: string
  createdAt: string
  updatedAt: string
}

export type TradeItem = {
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

export type GarageLedgerSettings = {
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

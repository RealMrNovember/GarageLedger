import type { CurrencyCode } from './currency'

export type TradeItem = {
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

export type GarageLedgerSettings = {
  currency: CurrencyCode
  lastBackupAt?: string | null
  lastUpdateCheckAt?: string | null
}

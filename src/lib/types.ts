import type { CurrencyCode } from './currency'

export type TradeItem = {
  id: string
  title: string
  category: string
  purchaseDate: string
  saleDate: string | null
  purchasePrice: number
  salePrice: number | null
}

export type GarageLedgerSettings = {
  currency: CurrencyCode
}

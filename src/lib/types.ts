import type { CurrencyCode } from './currency'

export type TradeItem = {
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
  sellerName: string
  sellerPhone: string
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

export type GarageLedgerSettings = {
  currency: CurrencyCode
  lastBackupAt?: string | null
  lastUpdateCheckAt?: string | null
}

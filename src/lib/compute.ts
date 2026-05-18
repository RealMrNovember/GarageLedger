import type { TradeItem } from './types'
import { addDays, parseIsoDate, startOfDay } from './dates'

export function itemProfit(item: TradeItem): number | null {
  if (item.status !== 'sold') return null
  if (!item.sellDate || item.sellPrice == null) return null
  const expenseTotal = (item.expenses ?? []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const tax = Number(item.tax ?? 0) || 0
  const commission = Number(item.commission ?? 0) || 0
  return item.sellPrice - (item.purchasePrice + expenseTotal + tax + commission)
}

export function estimateNetProfit(input: {
  status: TradeItem['status']
  purchasePrice: number
  sellPrice: number | null
  expenses: { amount: number }[]
  tax?: number | null
  commission?: number | null
  paymentMethod?: TradeItem['paymentMethod']
  barterTotal?: number
}): number | null {
  const expenseTotal = (input.expenses ?? []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const tax = Number(input.tax ?? 0) || 0
  const commission = Number(input.commission ?? 0) || 0
  const costs = (Number(input.purchasePrice) || 0) + expenseTotal + tax + commission

  let revenue: number | null = null
  if (input.status === 'reserved' && input.sellPrice != null && Number.isFinite(input.sellPrice)) {
    revenue = Number(input.sellPrice)
  } else if (input.status === 'sold') {
    if (input.paymentMethod === 'barter' && input.barterTotal != null && Number.isFinite(input.barterTotal)) {
      revenue = Number(input.barterTotal)
    } else if (input.sellPrice != null && Number.isFinite(input.sellPrice)) {
      revenue = Number(input.sellPrice)
    }
  }

  if (revenue == null) return null
  return revenue - costs
}

export function isInStock(item: TradeItem): boolean {
  return item.status !== 'sold'
}

export function totalExpenses(item: TradeItem): number {
  const base = (item.expenses ?? []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const tax = Number(item.tax ?? 0) || 0
  const commission = Number(item.commission ?? 0) || 0
  return base + tax + commission
}

export function reservedRemainingBalance(item: TradeItem): number | null {
  if (item.status !== 'reserved') return null
  if (item.sellPrice == null) return null
  const deposit = item.deposit ?? 0
  return item.sellPrice - deposit
}

export function paymentRemainingBalance(item: TradeItem): number {
  const v = Number(item.remainingBalance ?? 0)
  return Number.isFinite(v) ? v : 0
}

export function activeInvestment(items: TradeItem[]): number {
  return items.filter(isInStock).reduce((sum, item) => sum + item.purchasePrice, 0)
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function thisMonthPurchasedCount(items: TradeItem[], now = new Date()): number {
  return items.reduce((sum, item) => {
    const d = parseIsoDate(item.purchaseDate)
    if (!isSameMonth(d, now)) return sum
    return sum + 1
  }, 0)
}

export function thisMonthInvestment(items: TradeItem[], now = new Date()): number {
  return items.reduce((sum, item) => {
    const d = parseIsoDate(item.purchaseDate)
    if (!isSameMonth(d, now)) return sum
    return sum + item.purchasePrice
  }, 0)
}

export function thisMonthRevenue(items: TradeItem[], now = new Date()): number {
  return items.reduce((sum, item) => {
    if (item.status !== 'sold' || !item.sellDate || item.sellPrice == null) return sum
    const d = parseIsoDate(item.sellDate)
    if (!isSameMonth(d, now)) return sum
    return sum + item.sellPrice
  }, 0)
}

export function thisMonthNetProfit(items: TradeItem[], now = new Date()): number {
  return items.reduce((sum, item) => {
    if (item.status !== 'sold' || !item.sellDate) return sum
    const profit = itemProfit(item)
    if (profit == null) return sum
    const d = parseIsoDate(item.sellDate)
    if (!isSameMonth(d, now)) return sum
    return sum + profit
  }, 0)
}

export function weeklyProfitSeries(items: TradeItem[], now = new Date()): { label: string; value: number }[] {
  const end = startOfDay(now)
  const start = addDays(end, -6)
  const days = Array.from({ length: 7 }, (_, idx) => addDays(start, idx))

  return days.map((d) => {
    const label = d.toLocaleDateString(undefined, { weekday: 'short' })
    const value = items.reduce((sum, item) => {
      if (!item.sellDate) return sum
      const profit = itemProfit(item)
      if (profit == null) return sum
      const sale = startOfDay(parseIsoDate(item.sellDate))
      if (sale.getTime() !== d.getTime()) return sum
      return sum + profit
    }, 0)

    return { label, value }
  })
}

export function sixMonthSalesSeries(
  items: TradeItem[],
  now = new Date(),
  locale?: string,
): { label: string; soldCount: number; profit: number }[] {
  const months: Date[] = []
  const base = new Date(now.getFullYear(), now.getMonth(), 1)
  for (let i = 5; i >= 0; i -= 1) {
    months.push(new Date(base.getFullYear(), base.getMonth() - i, 1))
  }

  return months.map((m) => {
    const label = m.toLocaleDateString(locale, { month: 'short' })
    const agg = items.reduce(
      (acc, item) => {
        if (item.status !== 'sold' || !item.sellDate) return acc
        const sale = parseIsoDate(item.sellDate)
        if (sale.getFullYear() !== m.getFullYear() || sale.getMonth() !== m.getMonth()) return acc
        acc.soldCount += 1
        const profit = itemProfit(item)
        if (profit != null) acc.profit += profit
        return acc
      },
      { soldCount: 0, profit: 0 },
    )
    return { label, soldCount: agg.soldCount, profit: agg.profit }
  })
}

export function uniqueCategories(items: TradeItem[]): string[] {
  const base = ['Otomobil', 'Motosiklet', 'Kamyonet', 'Diğer']
  const set = new Set<string>(base)
  for (const item of items) {
    const cat = item.category?.trim()
    if (cat) set.add(cat)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

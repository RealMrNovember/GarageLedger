import type { TradeItem } from './types'
import { addDays, isSameMonth, parseIsoDate, startOfDay } from './dates'

export function itemProfit(item: TradeItem): number | null {
  if (!item.saleDate || item.salePrice == null) return null
  return item.salePrice - item.purchasePrice
}

export function isInStock(item: TradeItem): boolean {
  return !item.saleDate || item.salePrice == null
}

export function activeInvestment(items: TradeItem[]): number {
  return items.filter(isInStock).reduce((sum, item) => sum + item.purchasePrice, 0)
}

export function thisMonthProfit(items: TradeItem[], now = new Date()): number {
  return items.reduce((sum, item) => {
    if (!item.saleDate) return sum
    const profit = itemProfit(item)
    if (profit == null) return sum
    const sale = parseIsoDate(item.saleDate)
    if (!isSameMonth(sale, now)) return sum
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
      if (!item.saleDate) return sum
      const profit = itemProfit(item)
      if (profit == null) return sum
      const sale = startOfDay(parseIsoDate(item.saleDate))
      if (sale.getTime() !== d.getTime()) return sum
      return sum + profit
    }, 0)

    return { label, value }
  })
}

export function monthlyProfitSeries(items: TradeItem[], now = new Date()): { label: string; value: number }[] {
  const months: Date[] = []
  const base = new Date(now.getFullYear(), now.getMonth(), 1)
  for (let i = 5; i >= 0; i -= 1) {
    months.push(new Date(base.getFullYear(), base.getMonth() - i, 1))
  }

  return months.map((m) => {
    const label = m.toLocaleDateString(undefined, { month: 'short' })
    const value = items.reduce((sum, item) => {
      if (!item.saleDate) return sum
      const profit = itemProfit(item)
      if (profit == null) return sum
      const sale = parseIsoDate(item.saleDate)
      if (sale.getFullYear() !== m.getFullYear() || sale.getMonth() !== m.getMonth()) return sum
      return sum + profit
    }, 0)
    return { label, value }
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


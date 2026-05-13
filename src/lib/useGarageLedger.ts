import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CurrencyCode } from './currency'
import { api } from './api'
import type { TradeItem } from './types'

export function useGarageLedger() {
  const [items, setItems] = useState<TradeItem[]>([])
  const [currency, setCurrencyState] = useState<CurrencyCode>('AZN')
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    const [nextItems, settings] = await Promise.all([api.listItems(), api.getSettings()])
    setItems(nextItems)
    setCurrencyState(settings.currency)
    setReady(true)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const upsertItem = useCallback(async (item: TradeItem) => {
    const next = await api.upsertItem(item)
    setItems(next)
  }, [])

  const removeItem = useCallback(async (id: string) => {
    const next = await api.removeItem(id)
    setItems(next)
  }, [])

  const setCurrency = useCallback(async (next: CurrencyCode) => {
    const settings = await api.setCurrency(next)
    setCurrencyState(settings.currency)
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>(['Otomobil', 'Motosiklet', 'Kamyonet', 'Diğer'])
    for (const item of items) {
      const v = item.category?.trim()
      if (v) set.add(v)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [items])

  return { ready, items, currency, categories, refresh, upsertItem, removeItem, setCurrency }
}

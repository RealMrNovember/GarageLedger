import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CurrencyCode } from './currency'
import { api } from './api'
import type { Contact, GarageLedgerSettings, TradeItem } from './types'

export function useGarageLedger() {
  const [items, setItems] = useState<TradeItem[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [currency, setCurrencyState] = useState<CurrencyCode>('AZN')
  const [settings, setSettings] = useState<GarageLedgerSettings>({ currency: 'AZN' })
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [nextItems, nextContacts, settings] = await Promise.all([api.listItems(), api.listContacts(), api.getSettings()])
      setItems(nextItems)
      setContacts(nextContacts)
      setCurrencyState(settings.currency)
      setSettings(settings)
      setReady(true)
    } catch {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const upsertItem = useCallback(async (item: TradeItem) => {
    const next = await api.upsertItem(item)
    setItems(next)
  }, [])

  const upsertContact = useCallback(async (contact: Contact) => {
    const next = await api.upsertContact(contact)
    setContacts(next)
  }, [])

  const removeItem = useCallback(async (id: string) => {
    const next = await api.removeItem(id)
    setItems(next)
  }, [])

  const removeContact = useCallback(async (id: string) => {
    const next = await api.removeContact(id)
    setContacts(next)
  }, [])

  const setCurrency = useCallback(async (next: CurrencyCode) => {
    const settings = await api.setCurrency(next)
    setCurrencyState(settings.currency)
    setSettings(settings)
  }, [])

  const updateSettings = useCallback(async (patch: Partial<GarageLedgerSettings>) => {
    const next = await api.updateSettings(patch)
    setSettings(next)
    setCurrencyState(next.currency)
    return next
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>(['Otomobil', 'Motosiklet', 'Kamyonet', 'Diğer'])
    for (const item of items) {
      const v = item.category?.trim()
      if (v) set.add(v)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [items])

  return {
    ready,
    items,
    contacts,
    currency,
    settings,
    categories,
    refresh,
    upsertItem,
    upsertContact,
    removeItem,
    removeContact,
    setCurrency,
    updateSettings,
  }
}

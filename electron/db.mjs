import path from 'node:path'
import { app } from 'electron'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

const defaultData = { items: [], settings: { currency: 'AZN', lastBackupAt: null, lastUpdateCheckAt: null } }

let dbPromise

function migrateItem(raw) {
  if (!raw || typeof raw !== 'object') return null

  const anyItem = raw
  const brand = anyItem.brand ?? anyItem.title ?? anyItem.carModel ?? ''
  const model = anyItem.model ?? ''
  const year = anyItem.year == null ? null : Number(anyItem.year)
  const engine = anyItem.engine ?? ''

  const expenses = Array.isArray(anyItem.expenses) ? anyItem.expenses : []
  const normalizedExpenses = expenses
    .map((e) => {
      if (!e || typeof e !== 'object') return null
      const id = String(e.id ?? '')
      const date = String(e.date ?? '')
      const description = String(e.description ?? '')
      const amount = Number(e.amount ?? 0)
      if (!id) return null
      return { id, date, description, amount: Number.isFinite(amount) ? amount : 0 }
    })
    .filter(Boolean)

  const sellDate = anyItem.sellDate ?? anyItem.saleDate ?? null
  const sellPrice = anyItem.sellPrice ?? anyItem.salePrice ?? null
  const statusRaw = anyItem.status
  const status =
    statusRaw === 'sold' || (sellDate && sellPrice != null)
      ? 'sold'
      : statusRaw === 'reserved'
        ? 'reserved'
        : 'in_stock'

  const reserveDate = anyItem.reserveDate ?? null
  const deposit = anyItem.deposit == null ? null : Number(anyItem.deposit)
  const paymentMethodRaw = anyItem.paymentMethod
  const paymentMethod =
    paymentMethodRaw === 'installment' || paymentMethodRaw === 'barter' || paymentMethodRaw === 'cash'
      ? paymentMethodRaw
      : 'cash'
  const downPayment = anyItem.downPayment == null ? null : Number(anyItem.downPayment)
  const installmentCount = anyItem.installmentCount == null ? null : Number(anyItem.installmentCount)
  const remainingBalance = anyItem.remainingBalance == null ? null : Number(anyItem.remainingBalance)
  const nextPaymentDate = anyItem.nextPaymentDate ?? null
  const barterCash = anyItem.barterCash == null ? null : Number(anyItem.barterCash)
  const tradeInRaw = anyItem.tradeIn
  const tradeIn =
    tradeInRaw && typeof tradeInRaw === 'object'
      ? {
          brand: String(tradeInRaw.brand ?? ''),
          model: String(tradeInRaw.model ?? ''),
          year: tradeInRaw.year == null ? null : Number(tradeInRaw.year),
          engine: String(tradeInRaw.engine ?? ''),
          value: Number(tradeInRaw.value ?? 0),
        }
      : null
  const sellerName = anyItem.sellerName ?? ''
  const sellerPhone = anyItem.sellerPhone ?? ''
  const buyerName = anyItem.buyerName ?? ''
  const buyerPhone = anyItem.buyerPhone ?? ''

  return {
    id: String(anyItem.id ?? ''),
    brand: String(brand ?? ''),
    model: String(model ?? ''),
    year: Number.isFinite(year) ? year : null,
    engine: String(engine ?? ''),
    category: String(anyItem.category ?? 'Diğer'),
    purchaseDate: String(anyItem.purchaseDate ?? ''),
    purchasePrice: Number(anyItem.purchasePrice ?? 0),
    status,
    reserveDate: reserveDate ? String(reserveDate) : null,
    deposit: deposit == null || !Number.isFinite(deposit) ? null : deposit,
    paymentMethod,
    downPayment: downPayment == null || !Number.isFinite(downPayment) ? null : downPayment,
    installmentCount: installmentCount == null || !Number.isFinite(installmentCount) ? null : installmentCount,
    remainingBalance: remainingBalance == null || !Number.isFinite(remainingBalance) ? (status === 'sold' ? 0 : null) : remainingBalance,
    nextPaymentDate: nextPaymentDate ? String(nextPaymentDate) : null,
    barterCash: barterCash == null || !Number.isFinite(barterCash) ? null : barterCash,
    tradeIn:
      tradeIn && Number.isFinite(tradeIn.value)
        ? { ...tradeIn, year: Number.isFinite(tradeIn.year) ? tradeIn.year : null, value: tradeIn.value }
        : null,
    sellerName: String(sellerName ?? ''),
    sellerPhone: String(sellerPhone ?? ''),
    buyerName: String(buyerName ?? ''),
    buyerPhone: String(buyerPhone ?? ''),
    sellDate: sellDate ? String(sellDate) : null,
    sellPrice: sellPrice == null ? null : Number(sellPrice),
    expenses: normalizedExpenses,
  }
}

export async function getDb() {
  if (dbPromise) return dbPromise

  dbPromise = (async () => {
    const filePath = path.join(app.getPath('userData'), 'garageledger.json')
    const adapter = new JSONFile(filePath)
    const db = new Low(adapter, defaultData)
    await db.read()
    db.data ||= structuredClone(defaultData)
    db.data.items ||= []
    db.data.settings ||= { currency: 'AZN', lastBackupAt: null, lastUpdateCheckAt: null }
    if (!db.data.settings.currency) db.data.settings.currency = 'AZN'
    if (!('lastBackupAt' in db.data.settings)) db.data.settings.lastBackupAt = null
    if (!('lastUpdateCheckAt' in db.data.settings)) db.data.settings.lastUpdateCheckAt = null
    db.data.items = db.data.items.map(migrateItem).filter(Boolean)
    await db.write()
    return db
  })()

  return dbPromise
}

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

  const sellDate = anyItem.sellDate ?? anyItem.saleDate ?? null
  const sellPrice = anyItem.sellPrice ?? anyItem.salePrice ?? null
  const status = anyItem.status ?? (sellDate && sellPrice != null ? 'sold' : 'in_stock')

  return {
    id: String(anyItem.id ?? ''),
    brand: String(brand ?? ''),
    model: String(model ?? ''),
    year: Number.isFinite(year) ? year : null,
    engine: String(engine ?? ''),
    category: String(anyItem.category ?? 'Diğer'),
    purchaseDate: String(anyItem.purchaseDate ?? ''),
    purchasePrice: Number(anyItem.purchasePrice ?? 0),
    status: status === 'sold' ? 'sold' : 'in_stock',
    sellDate: sellDate ? String(sellDate) : null,
    sellPrice: sellPrice == null ? null : Number(sellPrice),
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

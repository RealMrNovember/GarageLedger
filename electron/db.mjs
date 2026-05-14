import path from 'node:path'
import crypto from 'node:crypto'
import { app } from 'electron'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

const defaultData = {
  items: [],
  contacts: [],
  settings: {
    currency: 'AZN',
    lastBackupAt: null,
    lastUpdateCheckAt: null,
    companyProfile: { name: '', logoDataUrl: '', address: '', phone: '', email: '', website: '' },
    appLock: { enabled: false, passwordSalt: null, passwordHash: null, supportCode: null },
  },
}

let dbPromise

function newId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return String(Date.now())
}

function normalizePartyKey(name, phone) {
  const p = String(phone ?? '').trim()
  if (p) return `p:${p}`
  const n = String(name ?? '').trim().toLowerCase()
  return n ? `n:${n}` : ''
}

function mergeRole(a, b) {
  if (!a) return b
  if (!b) return a
  if (a === b) return a
  return 'both'
}

function migrateItem(raw) {
  if (!raw || typeof raw !== 'object') return null

  const anyItem = raw
  const brand = anyItem.brand ?? anyItem.title ?? anyItem.carModel ?? ''
  const model = anyItem.model ?? ''
  const year = anyItem.year == null ? null : Number(anyItem.year)
  const engine = anyItem.engine ?? ''
  const vin = anyItem.vin ?? anyItem.VIN ?? anyItem.chassisNo ?? anyItem.chassis ?? ''

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
  const sellerContactId = anyItem.sellerContactId ?? null
  const buyerContactId = anyItem.buyerContactId ?? null

  return {
    id: String(anyItem.id ?? ''),
    brand: String(brand ?? ''),
    model: String(model ?? ''),
    year: Number.isFinite(year) ? year : null,
    engine: String(engine ?? ''),
    vin: String(vin ?? ''),
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
    sellerContactId: sellerContactId ? String(sellerContactId) : null,
    sellerName: String(sellerName ?? ''),
    sellerPhone: String(sellerPhone ?? ''),
    buyerContactId: buyerContactId ? String(buyerContactId) : null,
    buyerName: String(buyerName ?? ''),
    buyerPhone: String(buyerPhone ?? ''),
    sellDate: sellDate ? String(sellDate) : null,
    sellPrice: sellPrice == null ? null : Number(sellPrice),
    expenses: normalizedExpenses,
  }
}

function migrateContact(raw) {
  if (!raw || typeof raw !== 'object') return null
  const c = raw
  const id = String(c.id ?? '')
  if (!id) return null
  const createdAt = String(c.createdAt ?? new Date().toISOString())
  const updatedAt = String(c.updatedAt ?? createdAt)
  const roleRaw = c.role
  const role = roleRaw === 'buyer' || roleRaw === 'seller' || roleRaw === 'both' ? roleRaw : 'both'

  return {
    id,
    name: String(c.name ?? ''),
    phone: String(c.phone ?? ''),
    email: String(c.email ?? ''),
    role,
    notes: String(c.notes ?? ''),
    createdAt,
    updatedAt,
  }
}

function ensureContactsFromItems({ items, contacts }) {
  const map = new Map()
  for (const c of contacts) {
    const key = normalizePartyKey(c.name, c.phone)
    if (key) map.set(key, c)
  }

  for (const item of items) {
    const sellerKey = normalizePartyKey(item.sellerName, item.sellerPhone)
    if (sellerKey) {
      const existing = map.get(sellerKey)
      if (existing) {
        existing.role = mergeRole(existing.role, 'seller')
        item.sellerContactId ||= existing.id
      } else {
        const now = new Date().toISOString()
        const created = {
          id: newId(),
          name: item.sellerName ?? '',
          phone: item.sellerPhone ?? '',
          email: '',
          role: 'seller',
          notes: '',
          createdAt: now,
          updatedAt: now,
        }
        contacts.push(created)
        map.set(sellerKey, created)
        item.sellerContactId ||= created.id
      }
    }

    if (item.status !== 'in_stock') {
      const buyerKey = normalizePartyKey(item.buyerName, item.buyerPhone)
      if (buyerKey) {
        const existing = map.get(buyerKey)
        if (existing) {
          existing.role = mergeRole(existing.role, 'buyer')
          item.buyerContactId ||= existing.id
        } else {
          const now = new Date().toISOString()
          const created = {
            id: newId(),
            name: item.buyerName ?? '',
            phone: item.buyerPhone ?? '',
            email: '',
            role: 'buyer',
            notes: '',
            createdAt: now,
            updatedAt: now,
          }
          contacts.push(created)
          map.set(buyerKey, created)
          item.buyerContactId ||= created.id
        }
      }
    }
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
    db.data.contacts ||= []
    db.data.settings ||= { currency: 'AZN', lastBackupAt: null, lastUpdateCheckAt: null }
    if (!db.data.settings.currency) db.data.settings.currency = 'AZN'
    if (!('lastBackupAt' in db.data.settings)) db.data.settings.lastBackupAt = null
    if (!('lastUpdateCheckAt' in db.data.settings)) db.data.settings.lastUpdateCheckAt = null
    if (!('companyProfile' in db.data.settings) || !db.data.settings.companyProfile) {
      db.data.settings.companyProfile = { name: '', logoDataUrl: '', address: '', phone: '', email: '', website: '' }
    } else {
      const p = db.data.settings.companyProfile
      if (!('name' in p)) p.name = ''
      if (!('logoDataUrl' in p)) p.logoDataUrl = ''
      if (!('address' in p)) p.address = ''
      if (!('phone' in p)) p.phone = ''
      if (!('email' in p)) p.email = ''
      if (!('website' in p)) p.website = ''
    }
    if (!('appLock' in db.data.settings) || !db.data.settings.appLock) {
      db.data.settings.appLock = { enabled: false, passwordSalt: null, passwordHash: null, supportCode: null }
    } else {
      const l = db.data.settings.appLock
      if (!('enabled' in l)) l.enabled = false
      if (!('passwordSalt' in l)) l.passwordSalt = null
      if (!('passwordHash' in l)) l.passwordHash = null
      if (!('supportCode' in l)) l.supportCode = null
    }
    db.data.items = db.data.items.map(migrateItem).filter(Boolean)
    db.data.contacts = db.data.contacts.map(migrateContact).filter(Boolean)
    ensureContactsFromItems({ items: db.data.items, contacts: db.data.contacts })
    await db.write()
    return db
  })()

  return dbPromise
}

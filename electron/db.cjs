const path = require('node:path')
const crypto = require('node:crypto')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const { app } = require('electron')

const defaultData = {
  items: [],
  contacts: [],
  settings: {
    currency: 'AZN',
    lastBackupAt: null,
    lastUpdateCheckAt: null,
    reminders: { enabled: false, notifyHour: 10, daysBefore: 3 },
    fxUpdates: { provider: 'exchangerate-api', mode: '30m' },
    backupSettings: { schedule: 'daily', keepLast: 30 },
    companyProfile: { name: '', logoDataUrl: '', address: '', phone: '', email: '', website: '' },
    appLock: { enabled: false, passwordSalt: null, passwordHash: null, supportCode: null },
  },
}

let dbPromise

function deepClone(obj) {
  if (typeof globalThis.structuredClone === 'function') return globalThis.structuredClone(obj)
  return JSON.parse(JSON.stringify(obj))
}

function resolveDbFilePath() {
  const base = path.join(app.getPath('appData'), 'GarageLedger')
  return path.join(base, 'db.json')
}

async function ensureWritableDirectory(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true })
  try {
    await fsp.access(dirPath, fs.constants.W_OK)
  } catch {
    const probe = path.join(dirPath, `.__gl_write_probe_${process.pid}_${Date.now()}`)
    await fsp.writeFile(probe, 'ok', 'utf8')
    await fsp.unlink(probe)
  }
}

async function ensureDbFileLocation(filePath) {
  await ensureWritableDirectory(path.dirname(filePath))

  try {
    await fsp.access(filePath, fs.constants.F_OK)
    return
  } catch {}

  const appData = app.getPath('appData')
  const candidates = [
    path.join(appData, 'GarageLedger', 'garageledger.json'),
    path.join(appData, 'GarageLedger', 'db.json'),
    path.join(appData, 'garageledger', 'garageledger.json'),
    path.join(appData, 'Electron', 'garageledger.json'),
    path.join(app.getPath('userData'), 'garageledger.json'),
    path.join(app.getPath('userData'), 'db.json'),
  ].filter((p) => p !== filePath)

  for (const from of candidates) {
    try {
      await fsp.access(from, fs.constants.F_OK)
      await fsp.copyFile(from, filePath)
      return
    } catch {
      continue
    }
  }

  await atomicWriteJson(filePath, defaultData)
}

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
    package: String(anyItem.package ?? ''),
    year: Number.isFinite(year) ? year : null,
    engine: String(engine ?? ''),
    fuel: String(anyItem.fuel ?? ''),
    transmission: String(anyItem.transmission ?? ''),
    mileage: anyItem.mileage == null ? null : Number.isFinite(Number(anyItem.mileage)) ? Number(anyItem.mileage) : null,
    color: String(anyItem.color ?? ''),
    damage: String(anyItem.damage ?? ''),
    tramer: String(anyItem.tramer ?? ''),
    notes: String(anyItem.notes ?? ''),
    location: String(anyItem.location ?? ''),
    plate: String(anyItem.plate ?? ''),
    keyCount: anyItem.keyCount == null ? null : Number.isFinite(Number(anyItem.keyCount)) ? Number(anyItem.keyCount) : null,
    inspection: String(anyItem.inspection ?? ''),
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
    tax: anyItem.tax == null ? null : Number.isFinite(Number(anyItem.tax)) ? Number(anyItem.tax) : null,
    commission:
      anyItem.commission == null ? null : Number.isFinite(Number(anyItem.commission)) ? Number(anyItem.commission) : null,
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

async function readJsonFile(filePath) {
  try {
    const txt = await fsp.readFile(filePath, 'utf8')
    const parsed = JSON.parse(txt)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

async function atomicWriteJson(filePath, data) {
  await ensureWritableDirectory(path.dirname(filePath))
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
  const payload = JSON.stringify(data, null, 2)
  await fsp.writeFile(tmpPath, payload, 'utf8')
  try {
    await fsp.rename(tmpPath, filePath)
  } catch {
    await fsp.copyFile(tmpPath, filePath)
    try {
      await fsp.unlink(tmpPath)
    } catch {}
  }
}

async function normalizeAndMigrate(data) {
  const out = data && typeof data === 'object' ? data : {}
  const next = deepClone(defaultData)

  next.items = Array.isArray(out.items) ? out.items.map(migrateItem).filter(Boolean) : []
  next.contacts = Array.isArray(out.contacts) ? out.contacts.map(migrateContact).filter(Boolean) : []

  const settings = out.settings && typeof out.settings === 'object' ? out.settings : {}
  next.settings.currency = settings.currency === 'AZN' || settings.currency === 'USD' || settings.currency === 'EUR' || settings.currency === 'TRY' ? settings.currency : 'AZN'
  next.settings.lastBackupAt = 'lastBackupAt' in settings ? (settings.lastBackupAt == null ? null : String(settings.lastBackupAt)) : null
  next.settings.lastUpdateCheckAt = 'lastUpdateCheckAt' in settings ? (settings.lastUpdateCheckAt == null ? null : String(settings.lastUpdateCheckAt)) : null

  if ('reminders' in settings && settings.reminders && typeof settings.reminders === 'object') {
    const r = settings.reminders
    const enabled = Boolean(r.enabled)
    const notifyHour = Number(r.notifyHour)
    const daysBefore = Number(r.daysBefore)
    next.settings.reminders = {
      enabled,
      notifyHour: Number.isFinite(notifyHour) ? Math.max(0, Math.min(23, Math.trunc(notifyHour))) : 10,
      daysBefore: Number.isFinite(daysBefore) ? Math.max(0, Math.min(30, Math.trunc(daysBefore))) : 3,
    }
  }

  if ('fxUpdates' in settings && settings.fxUpdates && typeof settings.fxUpdates === 'object') {
    const f = settings.fxUpdates
    const provider = f.provider === 'exchangerate-api' ? 'exchangerate-api' : 'exchangerate-api'
    const mode = f.mode === 'manual' || f.mode === '15m' || f.mode === '30m' || f.mode === '1h' ? f.mode : '30m'
    next.settings.fxUpdates = { provider, mode }
  }

  if ('backupSettings' in settings && settings.backupSettings && typeof settings.backupSettings === 'object') {
    const b = settings.backupSettings
    const schedule =
      b.schedule === 'daily' || b.schedule === 'weekly' || b.schedule === 'monthly' || b.schedule === 'yearly' || b.schedule === 'manual'
        ? b.schedule
        : 'daily'
    const keepLast = Number(b.keepLast)
    next.settings.backupSettings = {
      schedule,
      keepLast: Number.isFinite(keepLast) ? Math.max(1, Math.min(365, Math.trunc(keepLast))) : 30,
    }
  }

  if ('companyProfile' in settings && settings.companyProfile && typeof settings.companyProfile === 'object') {
    const p = settings.companyProfile
    next.settings.companyProfile = {
      name: String(p.name ?? ''),
      logoDataUrl: String(p.logoDataUrl ?? ''),
      address: String(p.address ?? ''),
      phone: String(p.phone ?? ''),
      email: String(p.email ?? ''),
      website: String(p.website ?? ''),
    }
  }

  if ('appLock' in settings && settings.appLock && typeof settings.appLock === 'object') {
    const l = settings.appLock
    next.settings.appLock = {
      enabled: Boolean(l.enabled),
      passwordSalt: l.passwordSalt == null ? null : String(l.passwordSalt),
      passwordHash: l.passwordHash == null ? null : String(l.passwordHash),
      supportCode: l.supportCode == null ? null : String(l.supportCode),
    }
  }

  ensureContactsFromItems({ items: next.items, contacts: next.contacts })
  return next
}

async function getDb() {
  if (dbPromise) return dbPromise

  dbPromise = (async () => {
    const filePath = resolveDbFilePath()
    await ensureDbFileLocation(filePath)

    const db = {
      filePath,
      data: deepClone(defaultData),
      async read() {
        const raw = await readJsonFile(filePath)
        db.data = await normalizeAndMigrate(raw)
      },
      async write() {
        db.data = await normalizeAndMigrate(db.data)
        await atomicWriteJson(filePath, db.data)
      },
    }

    await db.read()
    await db.write()
    return db
  })()

  return dbPromise
}

module.exports = { getDb, resolveDbFilePath }

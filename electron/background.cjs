const { Notification, BrowserWindow, net } = require('electron')
const https = require('node:https')
const path = require('node:path')
const fs = require('node:fs/promises')
const { app } = require('electron')
const { getDb } = require('./db.cjs')

const FX_API = 'https://api.exchangerate-api.com/v4/latest/AZN'
const FX_STORAGE_KEY = 'garageledger.fxRates.v1'

let tickTimer = null
let state = {
  lastReminderKey: '',
  lastFxFetchAt: 0,
}

const COPY = {
  az: {
    paymentTitle: 'GarageLedger — Ödəniş xatırladıcısı',
    paymentBodyOne: '{{vehicle}} · Qalan {{amount}} · {{date}}',
    paymentBodyMany: '{{count}} yaxınlaşan ödəniş · Cəmi {{amount}}',
    fxTitle: 'GarageLedger — Məzənnə yeniləndi',
    fxBody: 'Valyuta kursları arxa fonda yeniləndi.',
  },
  tr: {
    paymentTitle: 'GarageLedger — Ödeme hatırlatıcısı',
    paymentBodyOne: '{{vehicle}} · Kalan {{amount}} · {{date}}',
    paymentBodyMany: '{{count}} yaklaşan tahsilat · Toplam {{amount}}',
    fxTitle: 'GarageLedger — Kur güncellendi',
    fxBody: 'Döviz kurları arka planda yenilendi.',
  },
  en: {
    paymentTitle: 'GarageLedger — Payment reminder',
    paymentBodyOne: '{{vehicle}} · Remaining {{amount}} · {{date}}',
    paymentBodyMany: '{{count}} upcoming collections · Total {{amount}}',
    fxTitle: 'GarageLedger — FX rates updated',
    fxBody: 'Exchange rates were refreshed in the background.',
  },
  ru: {
    paymentTitle: 'GarageLedger — Напоминание об оплате',
    paymentBodyOne: '{{vehicle}} · Остаток {{amount}} · {{date}}',
    paymentBodyMany: '{{count}} предстоящих платежей · Всего {{amount}}',
    fxTitle: 'GarageLedger — Курсы обновлены',
    fxBody: 'Курсы валют обновлены в фоне.',
  },
}

function fxModeToMs(mode) {
  switch (mode) {
    case '15m':
      return 15 * 60 * 1000
    case '30m':
      return 30 * 60 * 1000
    case '1h':
      return 60 * 60 * 1000
    default:
      return null
  }
}

function currencySymbol(code) {
  switch (code) {
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    case 'TRY':
      return '₺'
    default:
      return '₼'
  }
}

function formatAmount(value, currency) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const sym = currencySymbol(currency)
  return `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatVehicle(item) {
  const brand = String(item.brand ?? '').trim()
  const model = String(item.model ?? '').trim()
  const year = item.year == null ? '' : String(item.year)
  const head = [brand, model].filter(Boolean).join(' ')
  return [head, year].filter(Boolean).join(' · ') || '—'
}

function parseIsoDate(iso) {
  if (!iso) return null
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function tpl(str, vars) {
  return String(str).replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''))
}

async function readLocale() {
  const wins = BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed())
  for (const win of wins) {
    try {
      const lng = await win.webContents.executeJavaScript(
        "localStorage.getItem('i18nextLng') || localStorage.getItem('garageledger.language') || 'az'",
        true,
      )
      const code = String(lng ?? 'az').slice(0, 2)
      if (COPY[code]) return code
    } catch {
      continue
    }
  }
  return 'az'
}

function broadcast(channel, payload) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed()) continue
    win.webContents.send(channel, payload)
  }
}

function showNativeNotification({ title, body, icon }) {
  if (!Notification.isSupported()) return false
  try {
    const n = new Notification({
      title,
      body,
      icon,
      silent: false,
    })
    n.on('click', () => {
      const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed())
      if (!win) return
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    })
    n.show()
    return true
  } catch {
    return false
  }
}

function getDuePayments(items, daysBefore) {
  const today = new Date()
  const horizon = new Date(today)
  horizon.setDate(horizon.getDate() + Math.max(0, Number(daysBefore) || 0))

  return (items ?? [])
    .filter((x) => x && x.status === 'sold' && Number(x.remainingBalance ?? 0) > 0)
    .filter((x) => {
      const due = parseIsoDate(x.nextPaymentDate)
      if (!due) return true
      return due.getTime() <= horizon.getTime()
    })
    .map((x) => ({
      item: x,
      remaining: Number(x.remainingBalance ?? 0),
      due: parseIsoDate(x.nextPaymentDate),
    }))
}

async function runPaymentReminders(settings, icon) {
  const reminders = settings?.reminders
  if (!reminders?.enabled) return

  const now = new Date()
  const hour = now.getHours()
  const notifyHour = Math.max(0, Math.min(23, Number(reminders.notifyHour ?? 10)))
  if (hour !== notifyHour) return

  const dayKey = now.toISOString().slice(0, 10)
  const reminderKey = `payment:${dayKey}:${notifyHour}`
  if (state.lastReminderKey === reminderKey) return

  const db = await getDb()
  const due = getDuePayments(db.data.items ?? [], reminders.daysBefore ?? 3)
  if (!due.length) return

  state.lastReminderKey = reminderKey
  await saveState()

  const locale = await readLocale()
  const copy = COPY[locale] ?? COPY.az
  const currency = settings?.currency ?? 'AZN'
  const total = due.reduce((s, d) => s + d.remaining, 0)

  let body
  if (due.length === 1) {
    const d = due[0]
    body = tpl(copy.paymentBodyOne, {
      vehicle: formatVehicle(d.item),
      amount: formatAmount(d.remaining, currency),
      date: d.due ? d.due.toLocaleDateString() : '—',
    })
  } else {
    body = tpl(copy.paymentBodyMany, {
      count: due.length,
      amount: formatAmount(total, currency),
    })
  }

  showNativeNotification({ title: copy.paymentTitle, body, icon })
  broadcast('garageledger:background:notify', {
    kind: 'payment',
    title: copy.paymentTitle,
    body,
    count: due.length,
  })
}

function fetchFxRates() {
  return new Promise((resolve) => {
    const req = https.get(
      FX_API,
      { headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' } },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          res.resume()
          resolve(null)
          return
        }
        let raw = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          raw += chunk
        })
        res.on('end', () => {
          try {
            const json = JSON.parse(raw)
            const rates = json?.rates ?? {}
            resolve({
              base: 'AZN',
              fetchedAt: new Date().toISOString(),
              rates: {
                AZN: 1,
                USD: Number(rates.USD),
                EUR: Number(rates.EUR),
                TRY: Number(rates.TRY),
              },
            })
          } catch {
            resolve(null)
          }
        })
      },
    )
    req.on('error', () => resolve(null))
    req.setTimeout(10000, () => {
      req.destroy()
      resolve(null)
    })
  })
}

async function runFxRefresh(settings, icon) {
  const mode = settings?.fxUpdates?.mode ?? '30m'
  const interval = fxModeToMs(mode)
  if (!interval) return

  const now = Date.now()
  if (state.lastFxFetchAt && now - state.lastFxFetchAt < interval) return
  if (!net.isOnline()) return

  const data = await fetchFxRates()
  if (!data) return

  state.lastFxFetchAt = now
  await saveState()

  broadcast('garageledger:background:fxUpdated', data)

  const wins = BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed())
  for (const win of wins) {
    try {
      await win.webContents.executeJavaScript(
        `try { localStorage.setItem(${JSON.stringify(FX_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(data))}); window.dispatchEvent(new CustomEvent('garageledger-fx-updated', { detail: ${JSON.stringify(data)} })); } catch {}`,
        true,
      )
    } catch {
      continue
    }
  }

  const locale = await readLocale()
  const copy = COPY[locale] ?? COPY.az
  showNativeNotification({ title: copy.fxTitle, body: copy.fxBody, icon })
  broadcast('garageledger:background:notify', {
    kind: 'fx',
    title: copy.fxTitle,
    body: copy.fxBody,
  })
}

function statePath() {
  return path.join(app.getPath('userData'), 'background-state.json')
}

async function loadState() {
  try {
    const raw = await fs.readFile(statePath(), 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      state = {
        lastReminderKey: String(parsed.lastReminderKey ?? ''),
        lastFxFetchAt: Number(parsed.lastFxFetchAt ?? 0) || 0,
      }
    }
  } catch {
    return
  }
}

async function saveState() {
  try {
    await fs.writeFile(statePath(), JSON.stringify(state, null, 2), 'utf8')
  } catch {
    return
  }
}

async function tick(icon) {
  try {
    const db = await getDb()
    const settings = db.data.settings ?? {}
    await runFxRefresh(settings, icon)
    await runPaymentReminders(settings, icon)
  } catch {
    return
  }
}

function startBackgroundService({ icon } = {}) {
  if (tickTimer) return
  void loadState().then(() => {
    void tick(icon)
    tickTimer = setInterval(() => void tick(icon), 60 * 1000)
  })
}

function stopBackgroundService() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

module.exports = { startBackgroundService, stopBackgroundService }

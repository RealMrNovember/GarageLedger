const { BrowserWindow, app, ipcMain, net, powerMonitor } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')
const { autoUpdater } = require('electron-updater')
const { getDb } = require('./db.cjs')
const backups = require('./backups.cjs')

let lastUpdateStatus = { state: 'idle' }
let updateTimer = null
let maintenanceTimer = null

function broadcastUpdateStatus(payload) {
  lastUpdateStatus = payload
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('garageledger:update:status', payload)
  }
}

async function setLastUpdateCheckAt() {
  const db = await getDb()
  db.data.settings.lastUpdateCheckAt = new Date().toISOString()
  await db.write()
}

async function isOnlineForUpdateCheck() {
  const wins = BrowserWindow.getAllWindows()
  const win = wins.find((w) => !w.isDestroyed()) ?? null
  if (!win) return net.isOnline()
  try {
    const v = await win.webContents.executeJavaScript('navigator.onLine', true)
    return Boolean(v)
  } catch {
    return net.isOnline()
  }
}

function registerUpdaterIpc({ isDev }) {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.requestHeaders = { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }

  const safeCheckForUpdates = async () => {
    if (isDev) {
      broadcastUpdateStatus({ state: 'dev' })
      return { ok: false }
    }
    const online = await isOnlineForUpdateCheck()
    if (!online) return { ok: false }
    try {
      await setLastUpdateCheckAt()
      await autoUpdater.checkForUpdates()
      return { ok: true }
    } catch (e) {
      broadcastUpdateStatus({ state: 'error', message: e?.message ?? String(e) })
      return { ok: false }
    }
  }

  autoUpdater.on('checking-for-update', () => {
    broadcastUpdateStatus({ state: 'checking' })
  })
  autoUpdater.on('update-available', (info) => {
    broadcastUpdateStatus({ state: 'available', version: info?.version })
    if (!isDev) {
      void autoUpdater.downloadUpdate().catch((e) => {
        broadcastUpdateStatus({ state: 'error', message: e?.message ?? String(e) })
      })
    }
  })
  autoUpdater.on('update-not-available', (info) => {
    broadcastUpdateStatus({ state: 'upToDate', version: info?.version })
  })
  autoUpdater.on('download-progress', (progress) => {
    broadcastUpdateStatus({
      state: 'downloading',
      percent: Math.round((progress?.percent ?? 0) * 10) / 10,
      transferred: progress?.transferred,
      total: progress?.total,
      bytesPerSecond: progress?.bytesPerSecond,
    })
  })
  autoUpdater.on('update-downloaded', (info) => {
    broadcastUpdateStatus({ state: 'downloaded', version: info?.version })
  })
  autoUpdater.on('error', (err) => {
    broadcastUpdateStatus({ state: 'error', message: err?.message ?? String(err) })
  })

  ipcMain.handle('garageledger:update:getStatus', async () => {
    return lastUpdateStatus
  })

  ipcMain.handle('garageledger:update:check', async () => {
    return safeCheckForUpdates()
  })

  ipcMain.handle('garageledger:update:download', async () => {
    if (isDev) return { ok: false }
    try {
      void autoUpdater.downloadUpdate()
      return { ok: true }
    } catch (e) {
      broadcastUpdateStatus({ state: 'error', message: e?.message ?? String(e) })
      return { ok: false }
    }
  })

  ipcMain.handle('garageledger:update:install', async () => {
    if (isDev) return { ok: false }
    try {
      autoUpdater.quitAndInstall()
      return { ok: true }
    } catch (e) {
      broadcastUpdateStatus({ state: 'error', message: e?.message ?? String(e) })
      return { ok: false }
    }
  })

  if (!isDev) {
    setTimeout(() => {
      void safeCheckForUpdates()
    }, 250)
    if (!updateTimer) {
      updateTimer = setInterval(() => {
        void safeCheckForUpdates()
      }, 60 * 60 * 1000)
    }

    powerMonitor.on('resume', () => {
      setTimeout(() => {
        void safeCheckForUpdates()
      }, 8000)
    })
  }
}

function extractLatestCompletedPhase(markdown) {
  const text = String(markdown ?? '')
  const lines = text.split(/\r?\n/)
  const phases = []
  let current = null
  for (const line of lines) {
    const h = line.match(/^##\s+(.+?)\s*$/)
    if (h) {
      if (current) phases.push(current)
      current = { title: h[1].trim(), bullets: [] }
      continue
    }
    if (!current) continue
    const m = line.match(/^\s*-\s*\[(x|X)\]\s*(.+)\s*$/)
    if (m) current.bullets.push(m[2].trim())
  }
  if (current) phases.push(current)
  const completed = phases.filter((p) => p.bullets.length)
  if (!completed.length) return null
  return completed[completed.length - 1]
}

function extractCompletedPhases(markdown) {
  const text = String(markdown ?? '')
  const lines = text.split(/\r?\n/)
  const phases = []
  let current = null
  for (const line of lines) {
    const h = line.match(/^##\s+(.+?)\s*$/)
    if (h) {
      if (current) phases.push(current)
      current = { title: h[1].trim(), bullets: [] }
      continue
    }
    if (!current) continue
    const m = line.match(/^\s*-\s*\[(x|X)\]\s*(.+)\s*$/)
    if (m) current.bullets.push(m[2].trim())
  }
  if (current) phases.push(current)
  return phases
}

function compareVersions(a, b) {
  const pa = String(a).split('.').map((x) => Number(x))
  const pb = String(b).split('.').map((x) => Number(x))
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const av = pa[i] ?? 0
    const bv = pb[i] ?? 0
    if (av > bv) return 1
    if (av < bv) return -1
  }
  return 0
}

function sortReleasesByVersion(releases) {
  return [...releases].sort((a, b) => compareVersions(b.version, a.version))
}

function normalizeRelease(raw) {
  if (!raw || typeof raw !== 'object') return null
  const version = String(raw.version ?? '').trim()
  if (!version) return null
  const date = String(raw.date ?? '').trim()
  const phasesRaw = Array.isArray(raw.phases) ? raw.phases : []
  const phases = phasesRaw
    .map((p) => {
      if (!p || typeof p !== 'object') return null
      const title = String(p.title ?? '').trim()
      if (!title) return null
      const bullets = Array.isArray(p.bullets) ? p.bullets.map((b) => String(b)).filter(Boolean) : []
      return { title, bullets }
    })
    .filter(Boolean)
  return { version, date, phases }
}

async function readReleasesJson() {
  const candidates = [
    path.join(__dirname, '..', 'releases.json'),
    path.join(process.resourcesPath, 'releases.json'),
    path.join(app.getAppPath(), 'releases.json'),
    path.join(app.getAppPath(), '..', 'releases.json'),
    path.join(app.getAppPath(), '..', '..', 'releases.json'),
  ]

  for (const p of candidates) {
    try {
      const txt = await fs.readFile(p, 'utf8')
      const parsed = JSON.parse(txt)
      const releasesRaw = parsed && typeof parsed === 'object' ? parsed.releases : null
      const releases = Array.isArray(releasesRaw) ? releasesRaw.map(normalizeRelease).filter(Boolean) : []
      if (releases.length) return sortReleasesByVersion(releases)
    } catch {
      continue
    }
  }

  return []
}

function registerIpc({ isDev } = { isDev: false }) {
  registerUpdaterIpc({ isDev })
  void getDb().catch(() => {})
  if (!maintenanceTimer) {
    const run = async () => {
      try {
        const db = await getDb()
        const keepLast = db.data.settings?.backupSettings?.keepLast ?? 30
        await backups.ensureScheduledBackup()
        backups.cleanupBackups(keepLast)
      } catch {}
    }
    void run()
    maintenanceTimer = setInterval(run, 60 * 60 * 1000)
  }

  ipcMain.handle('garageledger:app:getInfo', async () => {
    return { version: app.getVersion(), name: app.getName(), isPackaged: app.isPackaged }
  })

  ipcMain.handle('garageledger:bootstrap:getInitialData', async () => {
    try {
      const db = await getDb()
      return { ok: true, items: db.data.items ?? [], contacts: db.data.contacts ?? [], settings: db.data.settings ?? { currency: 'AZN' } }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e), items: [], contacts: [], settings: { currency: 'AZN' } }
    }
  })

  ipcMain.handle('garageledger:pdf:getFont', async () => {
    const candidates = [
      'C:\\\\Windows\\\\Fonts\\\\arialuni.ttf',
      'C:\\\\Windows\\\\Fonts\\\\arial.ttf',
      'C:\\\\Windows\\\\Fonts\\\\calibri.ttf',
    ]
    for (const p of candidates) {
      try {
        const buf = await fs.readFile(p)
        return { ok: true, fileName: path.basename(p), base64: buf.toString('base64') }
      } catch {
        continue
      }
    }
    return { ok: false }
  })

  ipcMain.handle('garageledger:whatsnew:getLatestPhase', async () => {
    const releases = await readReleasesJson()
    const latest = releases[0]
    if (!latest) return { ok: false }
    const phase = latest.phases?.[0]
    return { ok: true, title: phase?.title ? `v${latest.version} — ${phase.title}` : `v${latest.version}`, bullets: phase?.bullets ?? [] }
  })

  ipcMain.handle('garageledger:whatsnew:getHistory', async () => {
    const releases = await readReleasesJson()
    return { ok: true, releases: releases.slice(0, 8) }
  })

  ipcMain.handle('garageledger:backup:ensureDaily', async () => {
    try {
      const out = await backups.ensureScheduledBackup()
      return { ok: true, created: out }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e) }
    }
  })
  ipcMain.handle('garageledger:backup:create', async () => {
    try {
      const out = await backups.createBackup({ reason: 'manual' })
      return { ok: true, created: out, cleanup: out?.cleanup }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e) }
    }
  })
  ipcMain.handle('garageledger:backup:list', async () => {
    try {
      return { ok: true, items: backups.listBackups() }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e), items: [] }
    }
  })
  ipcMain.handle('garageledger:backup:openFolder', async () => {
    try {
      await backups.openBackupFolder()
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e) }
    }
  })
  ipcMain.handle('garageledger:backup:cleanup', async (_evt, keepLast) => {
    try {
      const db = await getDb()
      const k = keepLast == null ? db.data.settings?.backupSettings?.keepLast ?? 30 : Number(keepLast)
      const out = backups.cleanupBackups(k)
      return { ok: true, result: out }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e) }
    }
  })
  ipcMain.handle('garageledger:backup:restore', async (_evt, fileName) => {
    try {
      const out = await backups.restoreBackup(String(fileName))
      return { ok: true, result: out }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e) }
    }
  })

  ipcMain.handle('garageledger:items:list', async () => {
    try {
      const db = await getDb()
      return db.data.items ?? []
    } catch {
      return []
    }
  })

  ipcMain.handle('garageledger:items:upsert', async (_evt, item) => {
    try {
      const db = await getDb()
      db.data.items ||= []
      const idx = db.data.items.findIndex((x) => x.id === item.id)
      if (idx >= 0) db.data.items[idx] = item
      else db.data.items.unshift(item)
      await db.write()
      return db.data.items
    } catch {
      return []
    }
  })

  ipcMain.handle('garageledger:items:remove', async (_evt, id) => {
    try {
      const db = await getDb()
      db.data.items ||= []
      db.data.items = db.data.items.filter((x) => x.id !== id)
      await db.write()
      return db.data.items
    } catch {
      return []
    }
  })

  ipcMain.handle('garageledger:contacts:list', async () => {
    try {
      const db = await getDb()
      return db.data.contacts ?? []
    } catch {
      return []
    }
  })

  ipcMain.handle('garageledger:contacts:upsert', async (_evt, contact) => {
    try {
      const db = await getDb()
      db.data.contacts ||= []
      const idx = db.data.contacts.findIndex((x) => x.id === contact.id)
      if (idx >= 0) db.data.contacts[idx] = contact
      else db.data.contacts.unshift(contact)
      await db.write()
      return db.data.contacts
    } catch {
      return []
    }
  })

  ipcMain.handle('garageledger:contacts:remove', async (_evt, id) => {
    try {
      const db = await getDb()
      db.data.contacts ||= []
      db.data.contacts = db.data.contacts.filter((x) => x.id !== id)
      await db.write()
      return db.data.contacts
    } catch {
      return []
    }
  })

  ipcMain.handle('garageledger:settings:get', async () => {
    try {
      const db = await getDb()
      return db.data.settings ?? { currency: 'AZN' }
    } catch {
      return { currency: 'AZN' }
    }
  })

  ipcMain.handle('garageledger:settings:setCurrency', async (_evt, currency) => {
    try {
      const db = await getDb()
      db.data.settings ||= { currency: 'AZN' }
      db.data.settings.currency = currency
      await db.write()
      return db.data.settings
    } catch {
      return { currency: 'AZN' }
    }
  })

  ipcMain.handle('garageledger:settings:update', async (_evt, patch) => {
    try {
      const db = await getDb()
      db.data.settings ||= { currency: 'AZN', lastBackupAt: null, lastUpdateCheckAt: null }
      const p = patch && typeof patch === 'object' ? patch : {}

      if ('currency' in p && (p.currency === 'AZN' || p.currency === 'USD' || p.currency === 'EUR' || p.currency === 'TRY')) {
        db.data.settings.currency = p.currency
      }

      if ('lastBackupAt' in p) db.data.settings.lastBackupAt = p.lastBackupAt == null ? null : String(p.lastBackupAt)
      if ('lastUpdateCheckAt' in p) db.data.settings.lastUpdateCheckAt = p.lastUpdateCheckAt == null ? null : String(p.lastUpdateCheckAt)

      if ('companyProfile' in p && p.companyProfile && typeof p.companyProfile === 'object') {
        db.data.settings.companyProfile ||= { name: '', logoDataUrl: '', address: '', phone: '', email: '', website: '' }
        const cp = p.companyProfile
        if ('name' in cp) db.data.settings.companyProfile.name = String(cp.name ?? '')
        if ('logoDataUrl' in cp) db.data.settings.companyProfile.logoDataUrl = String(cp.logoDataUrl ?? '')
        if ('address' in cp) db.data.settings.companyProfile.address = String(cp.address ?? '')
        if ('phone' in cp) db.data.settings.companyProfile.phone = String(cp.phone ?? '')
        if ('email' in cp) db.data.settings.companyProfile.email = String(cp.email ?? '')
        if ('website' in cp) db.data.settings.companyProfile.website = String(cp.website ?? '')
      }

      if ('appLock' in p && p.appLock && typeof p.appLock === 'object') {
        db.data.settings.appLock ||= { enabled: false, passwordSalt: null, passwordHash: null, supportCode: null }
        const al = p.appLock
        if ('enabled' in al) db.data.settings.appLock.enabled = Boolean(al.enabled)
        if ('passwordSalt' in al) db.data.settings.appLock.passwordSalt = al.passwordSalt == null ? null : String(al.passwordSalt)
        if ('passwordHash' in al) db.data.settings.appLock.passwordHash = al.passwordHash == null ? null : String(al.passwordHash)
        if ('supportCode' in al) db.data.settings.appLock.supportCode = al.supportCode == null ? null : String(al.supportCode)
      }

      if ('reminders' in p && p.reminders && typeof p.reminders === 'object') {
        db.data.settings.reminders ||= { enabled: false, notifyHour: 10, daysBefore: 3 }
        const r = p.reminders
        if ('enabled' in r) db.data.settings.reminders.enabled = Boolean(r.enabled)
        if ('notifyHour' in r) {
          const v = Number(r.notifyHour)
          if (Number.isFinite(v)) db.data.settings.reminders.notifyHour = Math.max(0, Math.min(23, Math.trunc(v)))
        }
        if ('daysBefore' in r) {
          const v = Number(r.daysBefore)
          if (Number.isFinite(v)) db.data.settings.reminders.daysBefore = Math.max(0, Math.min(30, Math.trunc(v)))
        }
      }

      if ('fxUpdates' in p && p.fxUpdates && typeof p.fxUpdates === 'object') {
        db.data.settings.fxUpdates ||= { provider: 'exchangerate-api', mode: '30m' }
        const f = p.fxUpdates
        if ('provider' in f && f.provider === 'exchangerate-api') db.data.settings.fxUpdates.provider = f.provider
        if ('mode' in f && (f.mode === 'manual' || f.mode === '15m' || f.mode === '30m' || f.mode === '1h')) db.data.settings.fxUpdates.mode = f.mode
      }

      if ('backupSettings' in p && p.backupSettings && typeof p.backupSettings === 'object') {
        db.data.settings.backupSettings ||= { schedule: 'daily', keepLast: 30 }
        const b = p.backupSettings
        if ('schedule' in b && (b.schedule === 'daily' || b.schedule === 'weekly' || b.schedule === 'monthly' || b.schedule === 'yearly' || b.schedule === 'manual')) {
          db.data.settings.backupSettings.schedule = b.schedule
        }
        if ('keepLast' in b) {
          const v = Number(b.keepLast)
          if (Number.isFinite(v)) db.data.settings.backupSettings.keepLast = Math.max(1, Math.min(365, Math.trunc(v)))
        }
      }

      await db.write()
      return db.data.settings
    } catch {
      return { currency: 'AZN' }
    }
  })
}

module.exports = { registerIpc }

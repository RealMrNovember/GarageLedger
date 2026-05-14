import { BrowserWindow, app, ipcMain, net, powerMonitor } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import updater from 'electron-updater'
import { createBackup, ensureDailyBackup, listBackups, openBackupFolder, restoreBackup } from './backups.mjs'
import { getDb } from './db.mjs'

const { autoUpdater } = updater

let lastUpdateStatus = { state: 'idle' }
let updateTimer = null

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
  autoUpdater.autoDownload = false
  autoUpdater.requestHeaders = { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }

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

export function registerIpc({ isDev } = { isDev: false }) {
  registerUpdaterIpc({ isDev })

  ipcMain.handle('garageledger:app:getInfo', async () => {
    return { version: app.getVersion(), name: app.getName(), isPackaged: app.isPackaged }
  })

  ipcMain.handle('garageledger:pdf:getFont', async () => {
    const candidates = [
      'C:\\\\Windows\\\\Fonts\\\\arial.ttf',
      'C:\\\\Windows\\\\Fonts\\\\arialuni.ttf',
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

  ipcMain.handle('garageledger:whatsnew:getLatestPhase', async () => {
    const candidates = [
      path.join(process.resourcesPath, 'prompt.md'),
      path.join(app.getAppPath(), 'prompt.md'),
      path.join(app.getAppPath(), '..', 'prompt.md'),
      path.join(app.getAppPath(), '..', '..', 'prompt.md'),
    ]
    for (const p of candidates) {
      try {
        const md = await fs.readFile(p, 'utf8')
        const phase = extractLatestCompletedPhase(md)
        if (!phase) return { ok: false }
        return { ok: true, title: phase.title, bullets: phase.bullets }
      } catch {
        continue
      }
    }
    return { ok: false }
  })

  ipcMain.handle('garageledger:backup:ensureDaily', async () => {
    try {
      const out = await ensureDailyBackup()
      return { ok: true, created: out }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e) }
    }
  })
  ipcMain.handle('garageledger:backup:create', async () => {
    try {
      const out = await createBackup({ reason: 'manual' })
      return { ok: true, created: out }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e) }
    }
  })
  ipcMain.handle('garageledger:backup:list', async () => {
    try {
      return { ok: true, items: listBackups() }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e), items: [] }
    }
  })
  ipcMain.handle('garageledger:backup:openFolder', async () => {
    try {
      await openBackupFolder()
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e) }
    }
  })
  ipcMain.handle('garageledger:backup:restore', async (_evt, fileName) => {
    try {
      const out = await restoreBackup(String(fileName))
      return { ok: true, result: out }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e) }
    }
  })

  ipcMain.handle('garageledger:items:list', async () => {
    const db = await getDb()
    return db.data.items
  })

  ipcMain.handle('garageledger:items:upsert', async (_evt, item) => {
    const db = await getDb()
    const idx = db.data.items.findIndex((x) => x.id === item.id)
    if (idx >= 0) db.data.items[idx] = item
    else db.data.items.unshift(item)
    await db.write()
    return db.data.items
  })

  ipcMain.handle('garageledger:items:remove', async (_evt, id) => {
    const db = await getDb()
    db.data.items = db.data.items.filter((x) => x.id !== id)
    await db.write()
    return db.data.items
  })

  ipcMain.handle('garageledger:contacts:list', async () => {
    const db = await getDb()
    return db.data.contacts ?? []
  })

  ipcMain.handle('garageledger:contacts:upsert', async (_evt, contact) => {
    const db = await getDb()
    db.data.contacts ||= []
    const idx = db.data.contacts.findIndex((x) => x.id === contact.id)
    if (idx >= 0) db.data.contacts[idx] = contact
    else db.data.contacts.unshift(contact)
    await db.write()
    return db.data.contacts
  })

  ipcMain.handle('garageledger:contacts:remove', async (_evt, id) => {
    const db = await getDb()
    db.data.contacts ||= []
    db.data.contacts = db.data.contacts.filter((x) => x.id !== id)
    await db.write()
    return db.data.contacts
  })

  ipcMain.handle('garageledger:settings:get', async () => {
    const db = await getDb()
    return db.data.settings
  })

  ipcMain.handle('garageledger:settings:setCurrency', async (_evt, currency) => {
    const db = await getDb()
    db.data.settings.currency = currency
    await db.write()
    return db.data.settings
  })

  ipcMain.handle('garageledger:settings:update', async (_evt, patch) => {
    const db = await getDb()
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

    await db.write()
    return db.data.settings
  })
}

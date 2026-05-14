import { BrowserWindow, app, ipcMain } from 'electron'
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

function registerUpdaterIpc({ isDev }) {
  autoUpdater.autoDownload = false
  autoUpdater.requestHeaders = { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }

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
    if (isDev) {
      broadcastUpdateStatus({ state: 'dev' })
      return { ok: false }
    }
    try {
      await setLastUpdateCheckAt()
      await autoUpdater.checkForUpdates()
      return { ok: true }
    } catch (e) {
      broadcastUpdateStatus({ state: 'error', message: e?.message ?? String(e) })
      return { ok: false }
    }
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
      void setLastUpdateCheckAt().then(() => autoUpdater.checkForUpdates())
    }, 250)
    if (!updateTimer) {
      updateTimer = setInterval(() => {
        void setLastUpdateCheckAt().then(() => autoUpdater.checkForUpdates())
      }, 60 * 60 * 1000)
    }
  }
}

export function registerIpc({ isDev } = { isDev: false }) {
  registerUpdaterIpc({ isDev })

  ipcMain.handle('garageledger:app:getInfo', async () => {
    return { version: app.getVersion(), name: app.getName(), isPackaged: app.isPackaged }
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
      db.data.settings.appLock ||= { enabled: false, passwordSalt: null, passwordHash: null }
      const al = p.appLock
      if ('enabled' in al) db.data.settings.appLock.enabled = Boolean(al.enabled)
      if ('passwordSalt' in al) db.data.settings.appLock.passwordSalt = al.passwordSalt == null ? null : String(al.passwordSalt)
      if ('passwordHash' in al) db.data.settings.appLock.passwordHash = al.passwordHash == null ? null : String(al.passwordHash)
    }

    await db.write()
    return db.data.settings
  })
}

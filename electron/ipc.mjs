import { BrowserWindow, ipcMain } from 'electron'
import updater from 'electron-updater'
import { createBackup, ensureDailyBackup, listBackups, openBackupFolder, restoreBackup } from './backups.mjs'
import { getDb } from './db.mjs'

const { autoUpdater } = updater

let lastUpdateStatus = { state: 'idle' }

function broadcastUpdateStatus(payload) {
  lastUpdateStatus = payload
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('garageledger:update:status', payload)
  }
}

function registerUpdaterIpc({ isDev }) {
  autoUpdater.autoDownload = false

  autoUpdater.on('checking-for-update', () => {
    broadcastUpdateStatus({ state: 'checking' })
  })
  autoUpdater.on('update-available', (info) => {
    broadcastUpdateStatus({ state: 'available', version: info?.version })
    void autoUpdater.downloadUpdate()
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
      await autoUpdater.checkForUpdates()
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
      void autoUpdater.checkForUpdates()
    }, 250)
  }
}

export function registerIpc({ isDev } = { isDev: false }) {
  registerUpdaterIpc({ isDev })

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
}

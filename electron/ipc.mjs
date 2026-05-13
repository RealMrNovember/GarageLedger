import { BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { getDb } from './db.mjs'

function broadcastUpdateStatus(payload) {
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
}

export function registerIpc({ isDev } = { isDev: false }) {
  registerUpdaterIpc({ isDev })

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

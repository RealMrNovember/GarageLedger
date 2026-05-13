import path from 'node:path'
import { app } from 'electron'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

const defaultData = { items: [], settings: { currency: 'AZN', lastBackupAt: null, lastUpdateCheckAt: null } }

let dbPromise

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
    await db.write()
    return db
  })()

  return dbPromise
}

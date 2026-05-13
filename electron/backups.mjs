import fs from 'node:fs'
import path from 'node:path'
import { app, shell } from 'electron'
import { getDb } from './db.mjs'

function dataFilePath() {
  return path.join(app.getPath('userData'), 'garageledger.json')
}

function backupDir() {
  return path.join(app.getPath('userData'), 'backups')
}

function toIsoFileStamp(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  )
}

export async function ensureDailyBackup() {
  const db = await getDb()
  const last = db.data.settings.lastBackupAt ? new Date(db.data.settings.lastBackupAt) : null
  const now = new Date()

  const sameDay =
    last &&
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate()

  if (sameDay) return null
  const out = await createBackup({ reason: 'daily' })
  return out
}

export async function createBackup({ reason } = { reason: 'manual' }) {
  fs.mkdirSync(backupDir(), { recursive: true })
  const stamp = toIsoFileStamp(new Date())
  const fileName = `backup_${stamp}_${reason}.json`
  const db = await getDb()
  await db.write()
  const src = dataFilePath()
  const dst = path.join(backupDir(), fileName)

  fs.copyFileSync(src, dst)

  db.data.settings.lastBackupAt = new Date().toISOString()
  await db.write()

  return { fileName, fullPath: dst }
}

export function listBackups() {
  fs.mkdirSync(backupDir(), { recursive: true })
  const dir = backupDir()
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.json') && f.toLowerCase().startsWith('backup_'))
    .map((f) => {
      const fullPath = path.join(dir, f)
      const stat = fs.statSync(fullPath)
      return { fileName: f, fullPath, size: stat.size, mtimeMs: stat.mtimeMs }
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
  return files
}

export function openBackupFolder() {
  fs.mkdirSync(backupDir(), { recursive: true })
  return shell.openPath(backupDir())
}

export async function restoreBackup(fileName) {
  const candidate = path.join(backupDir(), fileName)
  if (!candidate.startsWith(backupDir())) throw new Error('Invalid backup path')
  if (!fs.existsSync(candidate)) throw new Error('Backup not found')

  const src = candidate
  const dst = dataFilePath()

  const before = await createBackup({ reason: 'pre-restore' })
  fs.copyFileSync(src, dst)
  return { restoredFrom: fileName, safetyBackup: before.fileName }
}

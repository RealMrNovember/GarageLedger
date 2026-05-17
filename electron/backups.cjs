const fs = require('node:fs')
const path = require('node:path')
const { app, shell } = require('electron')
const { getDb, resolveDbFilePath } = require('./db.cjs')

function dataFilePath() {
  return resolveDbFilePath()
}

function backupDir() {
  return path.join(app.getPath('userData'), 'backups')
}

function toIsoFileStamp(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

async function ensureDailyBackup() {
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

function isDue(schedule, last, now) {
  if (!last) return true
  if (schedule === 'daily') {
    return !(last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() && last.getDate() === now.getDate())
  }
  if (schedule === 'weekly') {
    const diffMs = now.getTime() - last.getTime()
    return diffMs >= 7 * 24 * 60 * 60 * 1000
  }
  if (schedule === 'monthly') {
    return !(last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth())
  }
  if (schedule === 'yearly') {
    return last.getFullYear() !== now.getFullYear()
  }
  return false
}

async function ensureScheduledBackup() {
  const db = await getDb()
  const schedule = db.data.settings.backupSettings?.schedule ?? 'daily'
  if (schedule === 'manual') return null
  const last = db.data.settings.lastBackupAt ? new Date(db.data.settings.lastBackupAt) : null
  const now = new Date()
  if (!isDue(schedule, last, now)) return null
  const out = await createBackup({ reason: schedule })
  return out
}

async function createBackup({ reason } = { reason: 'manual' }) {
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

function listBackups() {
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

function cleanupBackups(keepLast) {
  const keep = Number.isFinite(Number(keepLast)) ? Math.max(1, Math.min(365, Math.trunc(Number(keepLast)))) : 30
  const files = listBackups()
  if (files.length <= keep) return { deleted: 0, kept: files.length }
  const toDelete = files.slice(keep)
  let deleted = 0
  for (const f of toDelete) {
    try {
      fs.unlinkSync(f.fullPath)
      deleted += 1
    } catch {}
  }
  return { deleted, kept: Math.max(0, files.length - deleted) }
}

function openBackupFolder() {
  fs.mkdirSync(backupDir(), { recursive: true })
  return shell.openPath(backupDir())
}

async function restoreBackup(fileName) {
  const candidate = path.join(backupDir(), fileName)
  if (!candidate.startsWith(backupDir())) throw new Error('Invalid backup path')
  if (!fs.existsSync(candidate)) throw new Error('Backup not found')

  const src = candidate
  const dst = dataFilePath()

  const before = await createBackup({ reason: 'pre-restore' })
  fs.copyFileSync(src, dst)
  return { restoredFrom: fileName, safetyBackup: before.fileName }
}

module.exports = { ensureDailyBackup, ensureScheduledBackup, createBackup, listBackups, cleanupBackups, openBackupFolder, restoreBackup }

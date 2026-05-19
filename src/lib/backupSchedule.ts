import type { GarageLedgerSettings } from './types'

export type BackupSchedule = NonNullable<GarageLedgerSettings['backupSettings']>['schedule']

export function formatNextBackupDue(
  schedule: BackupSchedule | undefined,
  lastBackupAt: string | null | undefined,
  locale?: string,
): string | null {
  const mode = schedule ?? 'daily'
  if (mode === 'manual') return null

  const now = new Date()
  const last = lastBackupAt ? new Date(lastBackupAt) : null
  if (Number.isNaN(last?.getTime() ?? Number.NaN)) {
    return new Date(now.getTime()).toLocaleString(locale)
  }

  const due = new Date(now.getTime())

  if (mode === 'daily') {
    due.setHours(0, 0, 0, 0)
    if (last && last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() && last.getDate() === now.getDate()) {
      due.setDate(due.getDate() + 1)
    }
  } else if (mode === 'weekly') {
    due.setTime(last!.getTime() + 7 * 24 * 60 * 60 * 1000)
    if (due.getTime() <= now.getTime()) due.setTime(now.getTime() + 24 * 60 * 60 * 1000)
  } else if (mode === 'monthly') {
    due.setDate(1)
    due.setHours(0, 0, 0, 0)
    if (last && last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth()) {
      due.setMonth(due.getMonth() + 1)
    }
  } else if (mode === 'yearly') {
    due.setMonth(0, 1)
    due.setHours(0, 0, 0, 0)
    if (last && last.getFullYear() === now.getFullYear()) {
      due.setFullYear(due.getFullYear() + 1)
    }
  }

  return due.toLocaleString(locale)
}

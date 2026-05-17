import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { i18n } from '../i18n'
import { refreshFxRates } from '../lib/currency'
import type { CurrencyCode } from '../lib/currency'
import type { GarageLedgerSettings } from '../lib/types'

const languages = ['az', 'tr', 'en', 'ru'] as const
type Lang = (typeof languages)[number]

type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version?: string }
  | { state: 'downloading'; percent?: number }
  | { state: 'downloaded'; version?: string }
  | { state: 'upToDate'; version?: string }
  | { state: 'error'; message?: string }
  | { state: 'dev' }

type BackupItem = { fileName: string; fullPath: string; size: number; mtimeMs: number }
const currencies = ['AZN', 'USD', 'EUR', 'TRY'] as const

function base64FromBytes(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function bytesFromBase64(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

function formatBytes(bytes: number): string {
  const v = Number(bytes)
  if (!Number.isFinite(v) || v <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB'] as const
  let idx = 0
  let n = v
  while (n >= 1024 && idx < units.length - 1) {
    n /= 1024
    idx += 1
  }
  return `${n.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}

async function hashPassword(password: string, saltB64: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits'])
  const salt = bytesFromBase64(saltB64)
  const saltBuf = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuf, iterations: 200_000, hash: 'SHA-256' },
    key,
    256,
  )
  return base64FromBytes(new Uint8Array(bits))
}

export function SettingsPage({
  settings,
  onUpdateSettings,
}: {
  settings: GarageLedgerSettings
  onUpdateSettings: (patch: Partial<GarageLedgerSettings>) => Promise<GarageLedgerSettings>
}) {
  const { t } = useTranslation()
  const current = (i18n.language as Lang) || 'az'
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })
  const [backupItems, setBackupItems] = useState<BackupItem[]>([])
  const [backupBusy, setBackupBusy] = useState(false)
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(settings.lastBackupAt ?? null)
  const [lastUpdateCheckAt, setLastUpdateCheckAt] = useState<string | null>(settings.lastUpdateCheckAt ?? null)
  const [appVersion, setAppVersion] = useState<string | null>(null)
  const [apiAvailable, setApiAvailable] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [lockCurrent, setLockCurrent] = useState('')
  const [lockNew, setLockNew] = useState('')
  const [lockConfirm, setLockConfirm] = useState('')
  const [supportCode, setSupportCode] = useState('')
  const [fxFetchedAt, setFxFetchedAt] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  useEffect(() => {
    const api = window.GarageLedger
    if (!api?.updates?.onStatus) return
    const off = api.updates.onStatus((payload) => {
      if (typeof payload !== 'object' || payload == null) return
      if (!('state' in payload)) return
      setStatus(payload as UpdateStatus)
    })
    return () => off()
  }, [])

  useEffect(() => {
    const api = window.GarageLedger
    setApiAvailable(Boolean(api))
    if (!api?.backups?.list) return

    const load = async () => {
      const [list, info, s] = await Promise.all([
        api.backups.list(),
        api.app?.getInfo?.(),
        api.updates?.getStatus?.(),
      ])
      setAppVersion(info?.version ?? null)
      if (list.ok) setBackupItems(list.items)
      if (s && typeof s === 'object' && 'state' in s) setStatus(s as UpdateStatus)
    }

    void load()
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('garageledger.fxRates.v1')
      if (!raw) return
      const parsed = JSON.parse(raw) as { fetchedAt?: string }
      if (parsed?.fetchedAt) setFxFetchedAt(String(parsed.fetchedAt))
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    setLastBackupAt(settings.lastBackupAt ?? null)
    setLastUpdateCheckAt(settings.lastUpdateCheckAt ?? null)
    const p = settings.companyProfile ?? {}
    setCompanyName(String(p.name ?? ''))
    setCompanyLogo(String(p.logoDataUrl ?? ''))
    setCompanyAddress(String(p.address ?? ''))
    setCompanyPhone(String(p.phone ?? ''))
    setCompanyEmail(String(p.email ?? ''))
    setCompanyWebsite(String(p.website ?? ''))
    setSupportCode(String(settings.appLock?.supportCode ?? ''))
  }, [settings])

  const canUpdate = apiAvailable && Boolean(window.GarageLedger?.updates)
  const canBackup = apiAvailable && Boolean(window.GarageLedger?.backups)
  const progress = useMemo(() => {
    if (status.state !== 'downloading') return null
    const p = Number(status.percent)
    if (!Number.isFinite(p)) return null
    return Math.max(0, Math.min(100, p))
  }, [status])
  const versionLabel = useMemo(() => {
    const version =
      status.state === 'available' || status.state === 'downloaded' || status.state === 'upToDate'
        ? status.version
        : undefined
    return version ? ` (v${version})` : ''
  }, [status])
  const lastBackupLabel = useMemo(() => {
    if (!lastBackupAt) return t('backups.never')
    const d = new Date(lastBackupAt)
    if (Number.isNaN(d.getTime())) return t('backups.never')
    return d.toLocaleString()
  }, [lastBackupAt, t])
  const lastUpdateCheckLabel = useMemo(() => {
    if (!lastUpdateCheckAt) return t('updates.neverChecked')
    const d = new Date(lastUpdateCheckAt)
    if (Number.isNaN(d.getTime())) return t('updates.neverChecked')
    return d.toLocaleString()
  }, [lastUpdateCheckAt, t])

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('settings.title')}</div>
      </div>

      <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink)]">{t('settings.sections.company')}</div>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('settings.company.title')}</div>
            <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('settings.company.subtitle')}</div>
          </div>
          <Button
            onClick={async () => {
              await onUpdateSettings({
                companyProfile: {
                  name: companyName.trim(),
                  logoDataUrl: companyLogo.trim(),
                  address: companyAddress.trim(),
                  phone: companyPhone.trim(),
                  email: companyEmail.trim(),
                  website: companyWebsite.trim(),
                },
              })
            }}
          >
            {t('settings.company.save')}
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.company.name')}</div>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            />
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.company.website')}</div>
            <input
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            />
          </div>
          <div className="lg:col-span-2">
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.company.address')}</div>
            <textarea
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            />
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.company.phone')}</div>
            <input
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            />
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.company.email')}</div>
            <input
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            />
          </div>
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.company.logo')}</div>
              {companyLogo ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--tf-ink)] underline decoration-[var(--tf-border)] underline-offset-4"
                  onClick={() => setCompanyLogo('')}
                >
                  {t('settings.company.removeLogo')}
                </button>
              ) : null}
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => setCompanyLogo(String(reader.result ?? ''))
                reader.readAsDataURL(file)
              }}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-2 text-sm text-[var(--tf-ink)] outline-none"
            />
            {companyLogo ? (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/40 p-3">
                <img src={companyLogo} alt="logo" className="h-10 w-10 rounded-xl object-cover" />
                <div className="text-xs text-[var(--tf-ink-muted)]">{t('settings.company.logoHint')}</div>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink)]">{t('settings.sections.security')}</div>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('settings.lock.title')}</div>
            <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('settings.lock.subtitle')}</div>
          </div>
          <div className="rounded-full border border-[var(--tf-border)] bg-[var(--tf-surface)]/50 px-3 py-1 text-xs font-semibold text-[var(--tf-ink)]">
            {settings.appLock?.enabled ? t('settings.lock.enabled') : t('settings.lock.disabled')}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.lock.current')}</div>
            <input
              value={lockCurrent}
              onChange={(e) => setLockCurrent(e.target.value)}
              type="password"
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            />
          </div>
          <div />
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.lock.new')}</div>
            <input
              value={lockNew}
              onChange={(e) => setLockNew(e.target.value)}
              type="password"
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            />
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.lock.confirm')}</div>
            <input
              value={lockConfirm}
              onChange={(e) => setLockConfirm(e.target.value)}
              type="password"
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/40 p-4">
          <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink)]">{t('settings.lock.supportCode')}</div>
          <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('settings.lock.supportCodeHint')}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={supportCode}
              onChange={(e) => setSupportCode(e.target.value)}
              type="password"
              className="w-full max-w-sm rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            />
            <Button
              variant="ghost"
              onClick={async () => {
                const hasExisting = Boolean(settings.appLock?.passwordHash && settings.appLock?.passwordSalt)
                if (!hasExisting) return
                const salt = settings.appLock?.passwordSalt ?? ''
                const hash = settings.appLock?.passwordHash ?? ''
                const currentHash = await hashPassword(lockCurrent, salt)
                if (currentHash !== hash) return
                await onUpdateSettings({ appLock: { ...(settings.appLock ?? { enabled: false, passwordSalt: null, passwordHash: null }), supportCode: supportCode.trim() || null } })
              }}
            >
              {t('settings.company.save')}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[var(--tf-ink-muted)]">{t('settings.lock.hint')}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                window.open('https://wa.me/905354895050', '_blank', 'noreferrer')
              }}
            >
              {t('settings.lock.forgot')}
            </Button>
            <Button
              onClick={async () => {
                const hasExisting = Boolean(settings.appLock?.passwordHash && settings.appLock?.passwordSalt)
                if (lockNew.trim().length < 4) return
                if (lockNew !== lockConfirm) return

                if (hasExisting) {
                  const salt = settings.appLock?.passwordSalt ?? ''
                  const hash = settings.appLock?.passwordHash ?? ''
                  const currentHash = await hashPassword(lockCurrent, salt)
                  if (currentHash !== hash) return
                }

                const saltBytes = new Uint8Array(16)
                crypto.getRandomValues(saltBytes)
                const saltB64 = base64FromBytes(saltBytes)
                const newHash = await hashPassword(lockNew, saltB64)
                await onUpdateSettings({ appLock: { enabled: true, passwordSalt: saltB64, passwordHash: newHash } })
                setLockCurrent('')
                setLockNew('')
                setLockConfirm('')
              }}
            >
              {settings.appLock?.enabled ? t('settings.lock.change') : t('settings.lock.enable')}
            </Button>
            {settings.appLock?.enabled ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  const salt = settings.appLock?.passwordSalt ?? ''
                  const hash = settings.appLock?.passwordHash ?? ''
                  if (!salt || !hash) return
                  const currentHash = await hashPassword(lockCurrent, salt)
                  if (currentHash !== hash) return
                  await onUpdateSettings({ appLock: { enabled: false, passwordSalt: null, passwordHash: null } })
                  setLockCurrent('')
                  setLockNew('')
                  setLockConfirm('')
                }}
              >
                {t('settings.lock.disable')}
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('updates.title')}</div>
            <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('updates.subtitle')}</div>
            <div className="mt-2 text-xs text-[var(--tf-ink-muted)]">
              {t('updates.currentVersion', { version: appVersion ? `v${appVersion}` : '—' })}
            </div>
            <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('updates.lastCheck', { value: lastUpdateCheckLabel })}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={async () => {
                if (typeof navigator !== 'undefined' && !navigator.onLine) return
                await window.GarageLedger?.updates?.check()
                const settings = await window.GarageLedger?.settings?.get()
                if (settings) {
                  setLastUpdateCheckAt(settings.lastUpdateCheckAt ?? null)
                  await onUpdateSettings({ lastUpdateCheckAt: settings.lastUpdateCheckAt ?? null })
                }
              }}
              disabled={!canUpdate || status.state === 'checking' || status.state === 'downloading'}
            >
              {t('updates.check')}
            </Button>
            {status.state === 'downloaded' ? (
              <Button onClick={() => void window.GarageLedger?.updates?.install()} disabled={!canUpdate}>
                {t('updates.restart')}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          {status.state === 'checking' ? (
            <div className="text-sm text-[var(--tf-ink)]">{t('updates.checking')}</div>
          ) : status.state === 'downloading' ? (
            <div className="space-y-2">
              <div className="text-sm text-[var(--tf-ink)]">{t('updates.downloading', { percent: progress ?? 0 })}</div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full bg-[var(--tf-accent)] transition-[width] duration-200"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
            </div>
          ) : status.state === 'downloaded' ? (
            <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/60 p-4 text-sm text-[var(--tf-ink)]">
              {t('updates.downloaded', { version: versionLabel })}
            </div>
          ) : status.state === 'upToDate' ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-900">
              {t('updates.upToDate', { version: versionLabel })}
            </div>
          ) : status.state === 'error' ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-900">
              {t('updates.error', { message: status.message ?? '' })}
            </div>
          ) : status.state === 'dev' ? (
            <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/60 p-4 text-sm text-[var(--tf-ink)]">
              {t('updates.dev')}
            </div>
          ) : (
            <div className="text-xs text-[var(--tf-ink-muted)]">{t('updates.idle')}</div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('backups.title')}</div>
            <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('backups.subtitle')}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={async () => {
                setBackupBusy(true)
                try {
                  const api = window.GarageLedger
                  if (!api?.backups) return
                  const created = await api.backups.create()
                  const list = await api.backups.list()
                  const nextSettings = await api.settings.get()
                  setLastBackupAt(nextSettings.lastBackupAt ?? null)
                  await onUpdateSettings({ lastBackupAt: nextSettings.lastBackupAt ?? null })
                  if (list.ok) setBackupItems(list.items)
                  if (!created.ok) setBackupBusy(false)
                } finally {
                  setBackupBusy(false)
                }
              }}
              disabled={!canBackup || backupBusy}
            >
              {t('backups.create')}
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                setBackupBusy(true)
                try {
                  const api = window.GarageLedger
                  if (!api?.backups) return
                  const list = await api.backups.list()
                  const nextSettings = await api.settings.get()
                  setLastBackupAt(nextSettings.lastBackupAt ?? null)
                  await onUpdateSettings({ lastBackupAt: nextSettings.lastBackupAt ?? null })
                  if (list.ok) setBackupItems(list.items)
                } finally {
                  setBackupBusy(false)
                }
              }}
              disabled={!canBackup || backupBusy}
            >
              {t('backups.refresh')}
            </Button>
            <Button variant="ghost" onClick={() => void window.GarageLedger?.backups?.openFolder()} disabled={!canBackup}>
              {t('backups.openFolder')}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[var(--tf-ink-muted)]">{t('backups.last', { value: lastBackupLabel })}</div>
          <div className="text-xs text-[var(--tf-ink-muted)]">{t('backups.count', { count: backupItems.length })}</div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('backups.schedule')}</div>
            <select
              value={settings.backupSettings?.schedule ?? 'daily'}
              onChange={(e) =>
                void onUpdateSettings({
                  backupSettings: {
                    schedule: e.target.value as NonNullable<GarageLedgerSettings['backupSettings']>['schedule'],
                    keepLast: settings.backupSettings?.keepLast ?? 30,
                  },
                })
              }
              className="mt-3 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            >
              <option value="daily">{t('backups.schedules.daily')}</option>
              <option value="weekly">{t('backups.schedules.weekly')}</option>
              <option value="monthly">{t('backups.schedules.monthly')}</option>
              <option value="yearly">{t('backups.schedules.yearly')}</option>
              <option value="manual">{t('backups.schedules.manual')}</option>
            </select>
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('backups.keepLast')}</div>
            <input
              type="number"
              min={1}
              max={365}
              value={Number(settings.backupSettings?.keepLast ?? 30)}
              onChange={(e) =>
                void onUpdateSettings({
                  backupSettings: { schedule: settings.backupSettings?.schedule ?? 'daily', keepLast: Number(e.target.value) },
                })
              }
              className="mt-3 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              variant="ghost"
              onClick={async () => {
                setBackupBusy(true)
                try {
                  const keepLast = settings.backupSettings?.keepLast ?? 30
                  await window.GarageLedger?.backups?.cleanup?.(keepLast)
                  const list = await window.GarageLedger?.backups?.list?.()
                  if (list?.ok) setBackupItems(list.items)
                } finally {
                  setBackupBusy(false)
                }
              }}
              disabled={!canBackup || backupBusy}
            >
              {t('backups.cleanup')}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/50 px-4 py-3">
            <div className="text-[11px] font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('backups.lastSuccessful')}</div>
            <div className="mt-1 text-sm font-semibold text-[var(--tf-ink)]">{backupItems[0]?.fileName ?? '—'}</div>
          </div>
          <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/50 px-4 py-3">
            <div className="text-[11px] font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('backups.lastSize')}</div>
            <div className="mt-1 text-sm font-semibold text-[var(--tf-ink)]">{formatBytes(backupItems[0]?.size ?? 0)}</div>
          </div>
          <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/50 px-4 py-3">
            <div className="text-[11px] font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('backups.lastAt')}</div>
            <div className="mt-1 text-sm font-semibold text-[var(--tf-ink)]">
              {backupItems[0]?.mtimeMs ? new Date(backupItems[0].mtimeMs).toLocaleString() : '—'}
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/40">
          {backupItems.length === 0 ? (
            <div className="px-4 py-4 text-sm text-[var(--tf-ink-muted)]">{t('backups.empty')}</div>
          ) : (
            <div className="divide-y divide-[var(--tf-border)]">
              {backupItems.slice(0, 20).map((b) => (
                <div key={b.fileName} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--tf-ink)]">{b.fileName}</div>
                    <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">
                      {new Date(b.mtimeMs).toLocaleString()} · {formatBytes(b.size)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        const ok = window.confirm(t('backups.restoreConfirm'))
                        if (!ok) return
                        setBackupBusy(true)
                        try {
                          const res = await window.GarageLedger?.backups?.restore(b.fileName)
                          const list = await window.GarageLedger?.backups?.list()
                          const nextSettings = await window.GarageLedger?.settings?.get()
                          if (nextSettings) {
                            setLastBackupAt(nextSettings.lastBackupAt ?? null)
                            await onUpdateSettings({ lastBackupAt: nextSettings.lastBackupAt ?? null })
                          }
                          if (list?.ok) setBackupItems(list.items)
                          if (!res?.ok) setBackupBusy(false)
                        } finally {
                          setBackupBusy(false)
                        }
                      }}
                      disabled={!canBackup || backupBusy}
                    >
                      {t('backups.restore')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink)]">{t('settings.sections.local')}</div>
      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.language')}</div>
            <select
              value={current}
              onChange={(e) => void i18n.changeLanguage(e.target.value)}
              className="mt-3 w-full max-w-sm rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            >
              {languages.map((lng) => (
                <option key={lng} value={lng}>
                  {t(`settings.languages.${lng}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.currency')}</div>
            <select
              value={(settings.currency ?? 'AZN') as CurrencyCode}
              onChange={(e) => void onUpdateSettings({ currency: e.target.value as CurrencyCode })}
              className="mt-3 w-full max-w-sm rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-[var(--tf-ink-muted)]">
              {t('settings.fx.last', { value: fxFetchedAt ? new Date(fxFetchedAt).toLocaleString() : '—' })}
            </div>
            <div className="mt-3">
              <Button
                variant="ghost"
                onClick={async () => {
                  if (typeof navigator !== 'undefined' && !navigator.onLine) return
                  const fx = await refreshFxRates()
                  setFxFetchedAt(fx?.fetchedAt ?? null)
                }}
              >
                {t('settings.fx.refresh')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('settings.reminders.title')}</div>
            <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('settings.reminders.subtitle')}</div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('settings.reminders.enabled')}</div>
              <button
                type="button"
                onClick={() =>
                  void onUpdateSettings({
                    reminders: {
                      enabled: !Boolean(settings.reminders?.enabled),
                      notifyHour: settings.reminders?.notifyHour ?? 10,
                      daysBefore: settings.reminders?.daysBefore ?? 3,
                    },
                  })
                }
                className="relative inline-flex h-9 w-16 items-center rounded-full border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-1 transition duration-200 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span className="sr-only">{t('settings.reminders.enabled')}</span>
                <span
                  className={[
                    'inline-block h-7 w-7 rounded-full bg-[var(--tf-accent)] shadow-sm transition duration-200',
                    settings.reminders?.enabled ? 'translate-x-7' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.reminders.notifyHour')}</div>
                <select
                  value={String(settings.reminders?.notifyHour ?? 10)}
                  onChange={(e) =>
                    void onUpdateSettings({
                      reminders: {
                        enabled: Boolean(settings.reminders?.enabled),
                        notifyHour: Number(e.target.value),
                        daysBefore: settings.reminders?.daysBefore ?? 3,
                      },
                    })
                  }
                  className="mt-3 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={String(h)}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.reminders.daysBefore')}</div>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={Number(settings.reminders?.daysBefore ?? 3)}
                  onChange={(e) =>
                    void onUpdateSettings({
                      reminders: {
                        enabled: Boolean(settings.reminders?.enabled),
                        notifyHour: settings.reminders?.notifyHour ?? 10,
                        daysBefore: Number(e.target.value),
                      },
                    })
                  }
                  className="mt-3 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('settings.fxUpdates.title')}</div>
            <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('settings.fxUpdates.subtitle')}</div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.fxUpdates.provider')}</div>
                <select
                  value={settings.fxUpdates?.provider ?? 'exchangerate-api'}
                  onChange={(e) =>
                    void onUpdateSettings({
                      fxUpdates: {
                        provider: (e.target.value as 'exchangerate-api') || 'exchangerate-api',
                        mode: settings.fxUpdates?.mode ?? '30m',
                      },
                    })
                  }
                  className="mt-3 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
                >
                  <option value="exchangerate-api">exchangerate-api</option>
                </select>
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.fxUpdates.interval')}</div>
                <select
                  value={settings.fxUpdates?.mode ?? '30m'}
                  onChange={(e) =>
                    void onUpdateSettings({
                      fxUpdates: { provider: settings.fxUpdates?.provider ?? 'exchangerate-api', mode: e.target.value as any },
                    })
                  }
                  className="mt-3 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
                >
                  <option value="15m">{t('settings.fxUpdates.intervals.m15')}</option>
                  <option value="30m">{t('settings.fxUpdates.intervals.m30')}</option>
                  <option value="1h">{t('settings.fxUpdates.intervals.h1')}</option>
                  <option value="manual">{t('settings.fxUpdates.intervals.manual')}</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/50 px-4 py-3">
                <div className="text-[11px] font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('settings.fxUpdates.internet')}</div>
                <div className="mt-1 text-sm font-semibold text-[var(--tf-ink)]">
                  {typeof navigator !== 'undefined' && navigator.onLine ? t('settings.fxUpdates.online') : t('settings.fxUpdates.offline')}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/50 px-4 py-3">
                <div className="text-[11px] font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('settings.fxUpdates.cache')}</div>
                <div className="mt-1 text-sm font-semibold text-[var(--tf-ink)]">{fxFetchedAt ? t('common.yes') : t('common.no')}</div>
              </div>
              <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/50 px-4 py-3">
                <div className="text-[11px] font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('settings.fxUpdates.cacheAt')}</div>
                <div className="mt-1 text-sm font-semibold text-[var(--tf-ink)]">{fxFetchedAt ? new Date(fxFetchedAt).toLocaleString() : '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {Boolean(settings.reminders?.enabled) || (settings.fxUpdates?.mode ?? 'manual') !== 'manual' ? (
          <div className="mt-6 rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/60 p-4 text-sm text-[var(--tf-ink)]">
            {t('settings.backgroundWarning')}
          </div>
        ) : null}
      </Card>

      <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink)]">{t('settings.sections.feedback')}</div>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('settings.feedback.title')}</div>
            <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('settings.feedback.subtitle')}</div>
          </div>
          <Button
            onClick={() => {
              const company = companyName.trim() || '—'
              const version = appVersion ? `v${appVersion}` : '—'
              const body = feedbackText.trim()
              const msg = encodeURIComponent(`Company: ${company}\nVersion: ${version}\n\n${body}`)
              window.open(`https://wa.me/905354895050?text=${msg}`, '_blank', 'noreferrer')
            }}
            disabled={!feedbackText.trim()}
          >
            {t('settings.feedback.send')}
          </Button>
        </div>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          rows={4}
          className="mt-4 w-full resize-none rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
          placeholder={t('settings.feedback.placeholder')}
        />
      </Card>
    </div>
  )
}

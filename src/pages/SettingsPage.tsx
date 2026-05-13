import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { i18n } from '../i18n'

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

export function SettingsPage() {
  const { t } = useTranslation()
  const current = (i18n.language as Lang) || 'az'
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })
  const [backupItems, setBackupItems] = useState<BackupItem[]>([])
  const [backupBusy, setBackupBusy] = useState(false)
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null)
  const [lastUpdateCheckAt, setLastUpdateCheckAt] = useState<string | null>(null)
  const [appVersion, setAppVersion] = useState<string | null>(null)
  const [apiAvailable, setApiAvailable] = useState(false)

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
      const [settings, list, info, s] = await Promise.all([
        api.settings.get(),
        api.backups.list(),
        api.app?.getInfo?.(),
        api.updates?.getStatus?.(),
      ])
      setLastBackupAt(settings.lastBackupAt ?? null)
      setLastUpdateCheckAt(settings.lastUpdateCheckAt ?? null)
      setAppVersion(info?.version ?? null)
      if (list.ok) setBackupItems(list.items)
      if (s && typeof s === 'object' && 'state' in s) setStatus(s as UpdateStatus)
    }

    void load()
  }, [])

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
        <div className="text-sm font-semibold text-slate-900">{t('settings.title')}</div>
      </div>

      <Card className="p-5">
        <div className="text-xs font-medium text-slate-600">{t('settings.language')}</div>
        <select
          value={current}
          onChange={(e) => void i18n.changeLanguage(e.target.value)}
          className="mt-3 w-full max-w-sm rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
        >
          {languages.map((lng) => (
            <option key={lng} value={lng}>
              {t(`settings.languages.${lng}`)}
            </option>
          ))}
        </select>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{t('updates.title')}</div>
            <div className="mt-1 text-xs text-slate-500">{t('updates.subtitle')}</div>
            <div className="mt-2 text-xs text-slate-500">
              {t('updates.currentVersion', { version: appVersion ? `v${appVersion}` : '—' })}
            </div>
            <div className="mt-1 text-xs text-slate-500">{t('updates.lastCheck', { value: lastUpdateCheckLabel })}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={async () => {
                await window.GarageLedger?.updates?.check()
                const settings = await window.GarageLedger?.settings?.get()
                if (settings) setLastUpdateCheckAt(settings.lastUpdateCheckAt ?? null)
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
            <div className="text-sm text-slate-700">{t('updates.checking')}</div>
          ) : status.state === 'downloading' ? (
            <div className="space-y-2">
              <div className="text-sm text-slate-700">{t('updates.downloading', { percent: progress ?? 0 })}</div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full bg-[var(--tf-accent)] transition-[width] duration-200"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
            </div>
          ) : status.state === 'downloaded' ? (
            <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 p-4 text-sm text-slate-800">
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
            <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 p-4 text-sm text-slate-700">
              {t('updates.dev')}
            </div>
          ) : (
            <div className="text-xs text-slate-500">{t('updates.idle')}</div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{t('backups.title')}</div>
            <div className="mt-1 text-xs text-slate-500">{t('backups.subtitle')}</div>
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
                  const settings = await api.settings.get()
                  setLastBackupAt(settings.lastBackupAt ?? null)
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
                  const settings = await api.settings.get()
                  setLastBackupAt(settings.lastBackupAt ?? null)
                  if (list.ok) setBackupItems(list.items)
                } finally {
                  setBackupBusy(false)
                }
              }}
              disabled={!canBackup || backupBusy}
            >
              {t('backups.refresh')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => void window.GarageLedger?.backups?.openFolder()}
              disabled={!canBackup}
            >
              {t('backups.openFolder')}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">{t('backups.last', { value: lastBackupLabel })}</div>
          <div className="text-xs text-slate-500">{t('backups.count', { count: backupItems.length })}</div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--tf-border)] bg-white/40">
          {backupItems.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-600">{t('backups.empty')}</div>
          ) : (
            <div className="divide-y divide-[var(--tf-border)]">
              {backupItems.slice(0, 20).map((b) => (
                <div key={b.fileName} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{b.fileName}</div>
                    <div className="mt-1 text-xs text-slate-500">{new Date(b.mtimeMs).toLocaleString()}</div>
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
                          const settings = await window.GarageLedger?.settings?.get()
                          if (settings) setLastBackupAt(settings.lastBackupAt ?? null)
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
    </div>
  )
}

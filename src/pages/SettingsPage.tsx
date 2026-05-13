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

export function SettingsPage() {
  const { t } = useTranslation()
  const current = (i18n.language as Lang) || 'az'
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })

  useEffect(() => {
    const api = window.GarageLedger
    if (!api?.updates?.onStatus) return
    const off = api.updates.onStatus((payload) => {
      if (!payload?.state) return
      setStatus(payload)
    })
    return () => off()
  }, [])

  const canUpdate = Boolean(window.GarageLedger?.updates)
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
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => void window.GarageLedger?.updates?.check()}
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
    </div>
  )
}

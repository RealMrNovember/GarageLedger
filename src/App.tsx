import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { BackgroundNotice, type BackgroundNoticeItem } from './components/BackgroundNotice'
import { Footer } from './components/Footer'
import { Logo } from './components/Logo'
import { AboutModal } from './components/AboutModal'
import { Modal } from './components/Modal'
import { Sidebar, type NavKey } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { UpdateReadyBanner } from './components/UpdateReadyBanner'
import { uniqueCategories } from './lib/compute'
import { useGarageLedger } from './lib/useGarageLedger'
import { FX_UPDATED_EVENT, fxModeToMs, refreshFxRates, type FxUpdateMode } from './lib/currency'
import { DashboardPage } from './pages/DashboardPage'
import { CustomersPage } from './pages/CustomersPage'
import { InventoryPage } from './pages/InventoryPage'
import { HelpPage } from './pages/HelpPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { parseReleaseHistory, type ReleaseEntry } from './lib/releases'

type UpdateStatus =
  | { state: 'idle' }
  | { state: 'available'; version: string }
  | { state: 'downloading'; version?: string; percent?: number; transferred?: number; total?: number }
  | { state: 'downloaded'; version?: string }
  | { state: 'error'; version?: string; message?: string }

export default function App() {
  const { t } = useTranslation()
  const { ready, items, contacts, currency, settings, setCurrency, updateSettings, upsertItem, upsertContact, removeItem } = useGarageLedger()
  const categories = useMemo(() => uniqueCategories(items), [items])
  const [nav, setNav] = useState<NavKey>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('garageledger.sidebarCollapsed') === '1')
  const [aboutOpen, setAboutOpen] = useState(false)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false)
  const [whatsNewVersion, setWhatsNewVersion] = useState<string>('')
  const [releaseHistory, setReleaseHistory] = useState<ReleaseEntry[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('garageledger.theme') === 'dark' ? 'dark' : 'light'))
  const [fxTick, setFxTick] = useState(0)
  const [backgroundNotices, setBackgroundNotices] = useState<BackgroundNoticeItem[]>([])
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ state: 'idle' })
  const updateVersion = 'version' in updateStatus ? updateStatus.version : ''
  const updateReady = updateStatus.state === 'downloaded'
  const [lockOpen, setLockOpen] = useState(false)
  const [lockUnlocked, setLockUnlocked] = useState(false)
  const [lockPassword, setLockPassword] = useState('')
  const [lockError, setLockError] = useState('')

  const lockEnabled = Boolean(
    settings.appLock?.enabled && settings.appLock.passwordSalt && settings.appLock.passwordHash,
  )

  const fxMode = (settings.fxUpdates?.mode ?? '30m') as FxUpdateMode

  const openReleaseNotes = useCallback(async () => {
    const api = window.GarageLedger
    const info = await api?.app?.getInfo?.()
    const version = info?.version ?? ''
    const historyRes = await api?.whatsNew?.getHistory?.()
    if (historyRes?.ok && Array.isArray(historyRes.releases)) {
      setReleaseHistory(parseReleaseHistory(historyRes.releases))
    }
    setWhatsNewVersion(version)
    setWhatsNewOpen(true)
    setAboutOpen(false)
  }, [])

  useEffect(() => {
    if (!whatsNewOpen) return
    const load = async () => {
      const res = await window.GarageLedger?.whatsNew?.getHistory?.()
      if (res?.ok && Array.isArray(res.releases)) {
        setReleaseHistory(parseReleaseHistory(res.releases))
        return
      }
      setReleaseHistory([])
    }
    void load()
  }, [whatsNewOpen])

  useEffect(() => {
    localStorage.setItem('garageledger.sidebarCollapsed', sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])

  useEffect(() => {
    const isDark = theme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('garageledger.theme', isDark ? 'dark' : 'light')
  }, [theme])

  useEffect(() => {
    void refreshFxRates({ mode: fxMode }).then((fx) => {
      if (fx) setFxTick(Date.now())
    })
  }, [fxMode])

  useEffect(() => {
    const intervalMs = fxModeToMs(fxMode)
    if (!intervalMs) return
    const id = window.setInterval(() => {
      void refreshFxRates({ mode: fxMode }).then((fx) => {
        if (fx) setFxTick(Date.now())
      })
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [fxMode])

  useEffect(() => {
    const api = window.GarageLedger
    if (!api?.background?.onNotify) return
    const off = api.background.onNotify((payload) => {
      const kind = payload?.kind === 'fx' ? 'fx' : 'payment'
      const title = String(payload?.title ?? '').trim()
      const body = String(payload?.body ?? '').trim()
      if (!title && !body) return
      const id = `${kind}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`
      setBackgroundNotices((prev) => [...prev.slice(-2), { id, kind, title, body }])
      window.setTimeout(() => {
        setBackgroundNotices((prev) => prev.filter((n) => n.id !== id))
      }, 9000)
    })
    return () => off()
  }, [])

  useEffect(() => {
    const api = window.GarageLedger
    const bumpFx = () => setFxTick(Date.now())
    const offIpc = api?.background?.onFxUpdated?.(() => bumpFx())
    const onDom = () => bumpFx()
    window.addEventListener(FX_UPDATED_EVENT, onDom)
    return () => {
      offIpc?.()
      window.removeEventListener(FX_UPDATED_EVENT, onDom)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    if (lockEnabled && !lockUnlocked) setLockOpen(true)
    if (!lockEnabled) {
      setLockOpen(false)
      setLockUnlocked(false)
    }
  }, [ready, lockEnabled, lockUnlocked])

  const unlock = async () => {
    setLockError('')
    const supportCode = String(settings.appLock?.supportCode ?? '').trim()
    if (supportCode && lockPassword.trim() === supportCode) {
      setLockPassword('')
      setLockUnlocked(true)
      setLockOpen(false)
      return
    }
    const salt = settings.appLock?.passwordSalt ?? ''
    const hash = settings.appLock?.passwordHash ?? ''
    if (!salt || !hash) {
      setLockOpen(false)
      return
    }
    try {
      const enc = new TextEncoder()
      const key = await crypto.subtle.importKey('raw', enc.encode(lockPassword), { name: 'PBKDF2' }, false, ['deriveBits'])
      const bin = atob(salt)
      const saltBytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i += 1) saltBytes[i] = bin.charCodeAt(i)
      const saltBuf = saltBytes.buffer.slice(saltBytes.byteOffset, saltBytes.byteOffset + saltBytes.byteLength) as ArrayBuffer
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBuf, iterations: 200_000, hash: 'SHA-256' },
        key,
        256,
      )
      const outBytes = new Uint8Array(bits)
      let out = ''
      for (const b of outBytes) out += String.fromCharCode(b)
      const derived = btoa(out)
      if (derived !== hash) {
        setLockError(t('lock.error'))
        return
      }
      setLockPassword('')
      setLockUnlocked(true)
      setLockOpen(false)
    } catch {
      setLockError(t('lock.error'))
    }
  }

  useEffect(() => {
    const api = window.GarageLedger
    if (!api?.updates?.getStatus) return
    void api.updates.getStatus().then((payload) => {
      if (payload && typeof payload === 'object' && 'state' in payload) {
        setUpdateStatus(payload as UpdateStatus)
      }
    })
  }, [])

  useEffect(() => {
    const api = window.GarageLedger
    if (!api?.updates?.onStatus) return
    const off = api.updates.onStatus((payload) => {
      const next = payload as UpdateStatus
      setUpdateStatus(next)
      if (next.state === 'error') setUpdateModalOpen(true)
    })
    return () => off()
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        active={nav}
        onNavigate={setNav}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        theme={theme}
        onToggleTheme={() => setTheme((v) => (v === 'dark' ? 'light' : 'dark'))}
        fxTick={fxTick}
        fxMode={fxMode}
        onRefreshFx={() =>
          void refreshFxRates({ force: true, mode: fxMode }).then((fx) => {
            if (fx) setFxTick(Date.now())
          })
        }
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {updateReady ? (
          <UpdateReadyBanner
            version={updateVersion}
            onRestart={() => void window.GarageLedger?.updates?.install?.()}
          />
        ) : null}
        <Topbar
          currency={currency}
          onCurrencyChange={(c) => void setCurrency(c)}
          onOpenAbout={() => setAboutOpen(true)}
        />

        <main
          className={[
            'min-w-0 flex-1 overflow-y-auto bg-[var(--tf-bg)] p-6',
            updateReady ? 'pb-24' : '',
          ].join(' ')}
        >
          {!ready ? (
            <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 p-6 text-sm text-slate-600 shadow-sm">
              {t('app.loading')}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={nav}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.2, 0.9, 0.2, 1] }}
                className="gl-animate-in"
              >
                {nav === 'dashboard' ? (
                  <DashboardPage items={items} currency={currency} onUpsert={(item) => void upsertItem(item)} />
                ) : nav === 'inventory' ? (
                  <InventoryPage
                    items={items}
                    contacts={contacts}
                    categories={categories}
                    currency={currency}
                    onUpsert={(item) => void upsertItem(item)}
                    onRemove={(id) => void removeItem(id)}
                    onUpsertContact={(contact) => void upsertContact(contact)}
                  />
                ) : nav === 'reports' ? (
                  <ReportsPage items={items} currency={currency} companyProfile={settings.companyProfile} />
                ) : nav === 'customers' ? (
                  <CustomersPage
                    items={items}
                    contacts={contacts}
                    currency={currency}
                    onUpsertContact={(contact) => void upsertContact(contact)}
                  />
                ) : nav === 'help' ? (
                  <HelpPage onOpenReleaseNotes={() => void openReleaseNotes()} />
                ) : (
                  <SettingsPage settings={settings} onUpdateSettings={(patch) => updateSettings(patch)} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        <Footer />
      </div>

      <AboutModal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onOpenReleaseNotes={() => void openReleaseNotes()}
      />

      {lockOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="gl-modal-overlay absolute inset-0" aria-hidden="true" />
          <div className="gl-modal-panel relative w-full max-w-md rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <Logo size={42} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('lock.title')}</div>
                <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('lock.subtitle')}</div>
              </div>
            </div>

            <div className="mt-5 gl-modal-root">
              <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('lock.password')}</div>
              <input
                value={lockPassword}
                onChange={(e) => setLockPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void unlock()
                }}
                type="password"
                className="gl-modal-field mt-2"
              />
              {lockError ? <div className="mt-2 text-xs font-semibold text-rose-600">{lockError}</div> : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                className="text-xs font-semibold text-[var(--tf-ink)] underline decoration-[var(--tf-border)] underline-offset-4"
                onClick={() => window.open('https://wa.me/905354895050', '_blank', 'noreferrer')}
              >
                {t('lock.forgot')}
              </button>
              <button
                type="button"
                className="rounded-2xl bg-[var(--tf-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-[0.5px] hover:shadow-md dark:text-black dark:hover:bg-[#b89145]"
                onClick={() => void unlock()}
              >
                {t('lock.unlock')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        title={t('whatsNew.title', { version: whatsNewVersion ? `v${whatsNewVersion}` : '' })}
        open={whatsNewOpen}
        onClose={() => {
          localStorage.setItem('garageledger.lastSeenVersion', whatsNewVersion)
          setWhatsNewOpen(false)
        }}
        maxWidthClassName="max-w-4xl"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--tf-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-[0.5px] hover:bg-black/90 hover:shadow-md dark:text-black dark:hover:bg-[#b89145]"
              onClick={() => {
                localStorage.setItem('garageledger.lastSeenVersion', whatsNewVersion)
                setWhatsNewOpen(false)
              }}
            >
              {t('whatsNew.cta')}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-3xl border border-[var(--tf-border)] bg-white p-5 dark:bg-gray-950">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[var(--tf-ink)]">
                {t('whatsNew.title', { version: whatsNewVersion ? `v${whatsNewVersion}` : '' })}
              </div>
              <div className="rounded-full border border-[var(--tf-border)] bg-white/60 px-3 py-1 text-xs font-semibold text-[var(--tf-ink)] dark:bg-white/10">
                v{whatsNewVersion}
              </div>
            </div>
            <div className="mt-2 text-xs text-[var(--tf-ink-muted)]">{t('whatsNew.subtitle')}</div>
          </div>

          <div className="relative">
            <div className="absolute left-[11px] top-0 h-full w-px bg-[var(--tf-border)]" />
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
              {(releaseHistory.length ? releaseHistory : []).map((r, index) => {
                const isLatest = index === 0 || r.version === whatsNewVersion
                return (
                  <div key={r.version} className="relative pl-10">
                    <div
                      className={[
                        'absolute left-[6px] top-[6px] h-3 w-3 rounded-full border bg-[var(--tf-accent)]',
                        isLatest ? 'border-[var(--tf-accent)] ring-4 ring-[var(--tf-accent)]/20' : 'border-[var(--tf-border)]',
                      ].join(' ')}
                    />
                    <div
                      className={[
                        'rounded-3xl border bg-white p-5 shadow-[var(--tf-shadow)] dark:bg-gray-950',
                        isLatest
                          ? 'border-[var(--tf-accent)]/35 ring-1 ring-[var(--tf-accent)]/15'
                          : 'border-[var(--tf-border)]',
                      ].join(' ')}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-[var(--tf-ink)]">v{r.version}</div>
                          {isLatest ? (
                            <span className="rounded-full bg-[var(--tf-accent)]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tf-ink)]">
                              {t('whatsNew.latestBadge')}
                            </span>
                          ) : null}
                        </div>
                        {r.date ? <div className="text-xs font-semibold text-[var(--tf-ink-muted)]">{r.date}</div> : null}
                      </div>

                      {r.phases.length ? (
                        <div className="mt-4 space-y-4">
                          {r.phases.map((p) => (
                            <div
                              key={`${r.version}:${p.title}`}
                              className="rounded-2xl border border-[var(--tf-border)] bg-white p-4 dark:bg-gray-900"
                            >
                              <div className="text-xs font-semibold text-[var(--tf-ink)]">{p.title}</div>
                              {p.bullets.length ? (
                                <ul className="mt-3 space-y-2 text-sm text-[var(--tf-ink-muted)]">
                                  {p.bullets.map((b) => (
                                    <li key={`${r.version}:${p.title}:${b}`} className="flex items-start gap-2">
                                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tf-accent)]/70" />
                                      <span className="min-w-0">{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="mt-2 text-xs text-[var(--tf-ink-muted)]">—</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 text-sm text-[var(--tf-ink-muted)]">—</div>
                      )}
                    </div>
                  </div>
                )
              })}
              {!releaseHistory.length ? (
                <div className="rounded-3xl border border-[var(--tf-border)] bg-white p-5 text-sm text-[var(--tf-ink-muted)] dark:bg-gray-950">
                  {t('whatsNew.emptyHistory')}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title={t('updateModal.title', { version: updateVersion ? `v${updateVersion}` : '' })}
        open={updateModalOpen}
        onClose={() => {
          if (updateStatus.state === 'available' && updateVersion) localStorage.setItem('garageledger.updateDismissedVersion', updateVersion)
          setUpdateModalOpen(false)
        }}
        maxWidthClassName="max-w-2xl"
        footer={
          updateStatus?.state === 'available' ? (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-2xl border border-[var(--tf-border)] bg-white/60 px-4 py-2 text-sm font-semibold text-[var(--tf-ink)] transition duration-200 hover:bg-black/5 dark:bg-white/5"
                onClick={() => {
                  if (updateVersion) localStorage.setItem('garageledger.updateDismissedVersion', updateVersion)
                  setUpdateModalOpen(false)
                }}
              >
                {t('updateModal.later')}
              </button>
              <button
                type="button"
                className="rounded-2xl bg-[var(--tf-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-[0.5px] hover:shadow-md dark:text-black dark:hover:bg-[#b89145]"
                onClick={() => void window.GarageLedger?.updates?.download?.()}
              >
                {t('updateModal.updateNow')}
              </button>
            </div>
          ) : updateStatus?.state === 'downloaded' ? (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-2xl bg-[var(--tf-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-[0.5px] hover:shadow-md dark:text-black dark:hover:bg-[#b89145]"
                onClick={() => void window.GarageLedger?.updates?.install?.()}
              >
                {t('updateModal.restartInstall')}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="rounded-2xl border border-[var(--tf-border)] bg-white/60 px-4 py-2 text-sm font-semibold text-[var(--tf-ink)] transition duration-200 hover:bg-black/5 dark:bg-white/5"
                onClick={() => setUpdateModalOpen(false)}
              >
                {t('common.close')}
              </button>
            </div>
          )
        }
      >
        <div className="space-y-4">
          {updateStatus?.state === 'available' ? (
            <div className="space-y-2">
              <div className="text-sm text-[var(--tf-ink)]">{t('updateModal.availableBody')}</div>
              <div className="text-xs text-[var(--tf-ink-muted)]">{t('updateModal.availableHint')}</div>
            </div>
          ) : updateStatus?.state === 'downloading' ? (
            <div className="space-y-3">
              <div className="text-sm text-[var(--tf-ink)]">{t('updateModal.downloadingBody')}</div>
              <div className="h-3 w-full overflow-hidden rounded-full border border-[var(--tf-border)] bg-white/40 dark:bg-white/5">
                <div
                  className="h-full rounded-full bg-[var(--tf-accent)] transition-[width] duration-200"
                  style={{ width: `${Math.min(100, Math.max(0, Number(updateStatus?.percent ?? 0)))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--tf-ink-muted)]">
                <div>{t('updateModal.progress', { percent: Math.round(Number(updateStatus?.percent ?? 0)) })}</div>
                <div>
                  {updateStatus?.transferred && updateStatus?.total
                    ? `${Math.round((Number(updateStatus.transferred) / Number(updateStatus.total)) * 100)}%`
                    : ''}
                </div>
              </div>
            </div>
          ) : updateStatus?.state === 'downloaded' ? (
            <div className="space-y-2">
              <div className="text-sm text-[var(--tf-ink)]">{t('updateModal.downloadedBody')}</div>
              <div className="text-xs text-[var(--tf-ink-muted)]">{t('updateModal.downloadedHint')}</div>
            </div>
          ) : updateStatus?.state === 'error' ? (
            <div className="space-y-2">
              <div className="text-sm text-[var(--tf-ink)]">{t('updateModal.errorBody')}</div>
              <div className="rounded-2xl border border-[var(--tf-border)] bg-white/60 p-3 text-xs text-[var(--tf-ink)] dark:bg-white/5">
                {String(updateStatus?.message ?? '')}
              </div>
            </div>
          ) : (
            <div className="text-sm text-[var(--tf-ink-muted)]">{t('updateModal.idleBody')}</div>
          )}
        </div>
      </Modal>

      <BackgroundNotice
        items={backgroundNotices}
        dismissLabel={t('backgroundNotice.dismiss')}
        onDismiss={(id) => setBackgroundNotices((prev) => prev.filter((n) => n.id !== id))}
      />
    </div>
  )
}

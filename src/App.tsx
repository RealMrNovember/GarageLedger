import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Footer } from './components/Footer'
import { Logo } from './components/Logo'
import { Modal } from './components/Modal'
import { Sidebar, type NavKey } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { uniqueCategories } from './lib/compute'
import { useGarageLedger } from './lib/useGarageLedger'
import { refreshFxRates } from './lib/currency'
import { DashboardPage } from './pages/DashboardPage'
import { CustomersPage } from './pages/CustomersPage'
import { InventoryPage } from './pages/InventoryPage'
import { HelpPage } from './pages/HelpPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((x) => Number(x))
  const pb = b.split('.').map((x) => Number(x))
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const av = pa[i] ?? 0
    const bv = pb[i] ?? 0
    if (av > bv) return 1
    if (av < bv) return -1
  }
  return 0
}

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
  const [releaseHistory, setReleaseHistory] = useState<
    Array<{ version: string; date: string; phases: Array<{ title: string; bullets: string[] }> }>
  >([])
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('garageledger.theme') === 'dark' ? 'dark' : 'light'))
  const [fxTick, setFxTick] = useState(0)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ state: 'idle' })
  const updateVersion = 'version' in updateStatus ? updateStatus.version : ''
  const [lockOpen, setLockOpen] = useState(false)
  const [lockUnlocked, setLockUnlocked] = useState(false)
  const [lockPassword, setLockPassword] = useState('')
  const [lockError, setLockError] = useState('')

  const lockEnabled = Boolean(
    settings.appLock?.enabled && settings.appLock.passwordSalt && settings.appLock.passwordHash,
  )

  useEffect(() => {
    if (!whatsNewOpen) return
    const load = async () => {
      const res = await window.GarageLedger?.whatsNew?.getHistory?.()
      if (res?.ok && Array.isArray(res.releases)) {
        setReleaseHistory(
          res.releases
            .map((r) => {
              const version = String(r?.version ?? '').trim()
              if (!version) return null
              const date = String(r?.date ?? '').trim()
              const phases = Array.isArray(r?.phases)
                ? r.phases
                    .map((p) => ({
                      title: String(p?.title ?? '').trim(),
                      bullets: Array.isArray(p?.bullets) ? p.bullets.map((b) => String(b)) : [],
                    }))
                    .filter((p) => p.title)
                : []
              return { version, date, phases }
            })
            .filter((x): x is { version: string; date: string; phases: Array<{ title: string; bullets: string[] }> } => Boolean(x)),
        )
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
    void refreshFxRates().then(() => setFxTick(Date.now()))
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
    if (!api?.updates?.onStatus) return
    const dismissedKey = 'garageledger.updateDismissedVersion'
    const off = api.updates.onStatus((payload) => {
      const next = payload as UpdateStatus
      setUpdateStatus(next)
      const state = next.state
      const version = 'version' in next ? String(next.version ?? '') : ''
      if (state === 'available' && version) {
        const dismissed = localStorage.getItem(dismissedKey) ?? ''
        if (dismissed !== version) setUpdateModalOpen(true)
      }
      if (state === 'downloading' || state === 'downloaded' || state === 'error') setUpdateModalOpen(true)
    })
    return () => off()
  }, [])

  useEffect(() => {
    const api = window.GarageLedger
    if (!api?.app?.getInfo) return

    const key = 'garageledger.lastSeenVersion'
    const run = async () => {
      const info = await api.app.getInfo()
      const currentVersion = info?.version ?? ''
      if (!currentVersion) return
      const lastSeen = localStorage.getItem(key) ?? ''

      if (!lastSeen || compareVersions(currentVersion, lastSeen) > 0) {
        setWhatsNewVersion(currentVersion)
        setWhatsNewOpen(true)
      }
    }

    void run()
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
        onRefreshFx={() => void refreshFxRates().then(() => setFxTick(Date.now()))}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          currency={currency}
          onCurrencyChange={(c) => void setCurrency(c)}
          onOpenAbout={() => setAboutOpen(true)}
        />

        <main className="min-w-0 flex-1 overflow-y-auto bg-[var(--tf-bg)] p-6">
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
                  <HelpPage />
                ) : (
                  <SettingsPage settings={settings} onUpdateSettings={(patch) => updateSettings(patch)} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        <Footer />
      </div>

      <Modal title={t('about.title')} open={aboutOpen} onClose={() => setAboutOpen(false)}>
        <div className="space-y-5">
          <div className="rounded-3xl border border-[var(--tf-border)] bg-white p-5 shadow-[var(--tf-shadow)] dark:bg-gray-950">
            <div className="flex items-start gap-4">
              <Logo size={46} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('app.name')}</div>
                <div className="mt-1 text-sm text-[var(--tf-ink-muted)]">{t('about.desc')}</div>
                <div className="mt-3 text-xs font-medium text-[var(--tf-ink-muted)]">{t('about.createdBy')}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-3xl border border-[var(--tf-border)] bg-white p-5 shadow-[var(--tf-shadow)] dark:bg-gray-950">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/60">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 6.5h16v11H4v-11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                      <path d="M4.5 7l7.5 6l7.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('about.actions.emailTitle')}</div>
                    <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('about.actions.emailDesc')}</div>
                  </div>
                </div>
                <a
                  href="mailto:mozkarci1991@gmail.com"
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--tf-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-[0.5px] hover:bg-black/90 hover:shadow-md dark:text-black dark:hover:bg-[#b89145]"
                >
                  {t('about.actions.emailCta')}
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--tf-border)] bg-white p-5 shadow-[var(--tf-shadow)] dark:bg-gray-950">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/60">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M9 19c-3 1-3-1-4-1m8 2v-2.2c0-.7.2-1.3.6-1.8c-2 .2-4.1-1-4.1-4.4c0-1 .3-1.8.9-2.5c-.1-.2-.4-1.2.1-2.4c0 0 .8-.2 2.6 1c.7-.2 1.5-.3 2.3-.3s1.6.1 2.3.3c1.8-1.2 2.6-1 2.6-1c.5 1.2.2 2.2.1 2.4c.6.7.9 1.5.9 2.5c0 3.4-2.1 4.6-4.1 4.4c.4.5.6 1.1.6 1.8V20"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('about.actions.githubTitle')}</div>
                    <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('about.actions.githubDesc')}</div>
                  </div>
                </div>
                <a
                  href="https://github.com/RealMrNovember/GarageLedger"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-2 text-sm font-semibold text-[var(--tf-ink)] transition duration-200 hover:-translate-y-[0.5px] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {t('about.actions.githubCta')}
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--tf-border)] bg-white p-5 shadow-[var(--tf-shadow)] dark:bg-gray-950">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/60">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M16.6 14.4c-.2 0-.4 0-.6-.1c-1.2-.3-2.6-1.1-3.8-2.3c-1.2-1.2-2-2.6-2.3-3.8c-.2-.8.1-1.5.8-1.9l1.1-.6c.6-.3 1.3-.2 1.8.3l1 1.1c.4.5.5 1.2.2 1.8l-.3.6c.6 1 1.4 1.9 2.3 2.7c.9.9 1.8 1.7 2.7 2.3l.6-.3c.6-.3 1.3-.2 1.8.2l1.1 1c.5.5.6 1.2.3 1.8l-.6 1.1c-.3.6-.9.9-1.5.9c-.2 0-.3 0-.5 0c-1.3-.2-2.8-1-4.3-2.2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M7 4h10a3 3 0 0 1 3 3v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('about.actions.whatsappTitle')}</div>
                    <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('about.actions.whatsappDesc')}</div>
                  </div>
                </div>
                <a
                  href="https://wa.me/905354895050"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-2 text-sm font-semibold text-[var(--tf-ink)] transition duration-200 hover:-translate-y-[0.5px] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {t('about.actions.whatsappCta')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {lockOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/80" />
          <div className="relative w-full max-w-md rounded-3xl border border-[var(--tf-border)] bg-white p-6 shadow-[var(--tf-shadow)] dark:bg-gray-950">
            <div className="flex items-start gap-4">
              <Logo size={42} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('lock.title')}</div>
                <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('lock.subtitle')}</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('lock.password')}</div>
              <input
                value={lockPassword}
                onChange={(e) => setLockPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void unlock()
                }}
                type="password"
                className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
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
              {(releaseHistory.length ? releaseHistory : []).map((r) => (
                <div key={r.version} className="relative pl-10">
                  <div className="absolute left-[6px] top-[6px] h-3 w-3 rounded-full border border-[var(--tf-border)] bg-[var(--tf-accent)]" />
                  <div className="rounded-3xl border border-[var(--tf-border)] bg-white p-5 shadow-[var(--tf-shadow)] dark:bg-gray-950">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-[var(--tf-ink)]">v{r.version}</div>
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
              ))}
              {!releaseHistory.length ? (
                <div className="rounded-3xl border border-[var(--tf-border)] bg-white p-5 text-sm text-[var(--tf-ink-muted)] dark:bg-gray-950">
                  Sürüm geçmişi alınamadı.
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
    </div>
  )
}

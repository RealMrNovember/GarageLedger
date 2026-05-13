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

export default function App() {
  const { t } = useTranslation()
  const { ready, items, contacts, currency, setCurrency, upsertItem, upsertContact, removeItem } = useGarageLedger()
  const categories = useMemo(() => uniqueCategories(items), [items])
  const [nav, setNav] = useState<NavKey>('dashboard')
  const [aboutOpen, setAboutOpen] = useState(false)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false)
  const [whatsNewVersion, setWhatsNewVersion] = useState<string>('')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('garageledger.theme') === 'dark' ? 'dark' : 'light'))
  const [_fxTick, setFxTick] = useState(0)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<any>({ state: 'idle' })
  const whatsNewSections = useMemo(() => {
    const raw = t('whatsNew.sections', { returnObjects: true }) as unknown
    if (!Array.isArray(raw)) return []
    return raw
      .filter((x) => x && typeof x === 'object')
      .map((x) => {
        const obj = x as Record<string, unknown>
        return {
          title: String(obj.title ?? ''),
          body: String(obj.body ?? ''),
          bullets: Array.isArray(obj.bullets) ? (obj.bullets as unknown[]).map((b) => String(b)) : [],
        }
      })
      .filter((s) => s.title)
  }, [t])

  useEffect(() => {
    const isDark = theme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('garageledger.theme', isDark ? 'dark' : 'light')
  }, [theme])

  useEffect(() => {
    void refreshFxRates().then(() => setFxTick(Date.now()))
  }, [])

  useEffect(() => {
    const api = window.GarageLedger
    if (!api?.updates?.onStatus) return
    const dismissedKey = 'garageledger.updateDismissedVersion'
    const off = api.updates.onStatus((payload) => {
      setUpdateStatus(payload as any)
      const state = (payload as any)?.state
      const version = String((payload as any)?.version ?? '')
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
        theme={theme}
        onToggleTheme={() => setTheme((v) => (v === 'dark' ? 'light' : 'dark'))}
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
                  <ReportsPage items={items} currency={currency} />
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
                  <SettingsPage />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        <Footer />
      </div>

      <Modal title={t('about.title')} open={aboutOpen} onClose={() => setAboutOpen(false)}>
        <div className="flex items-start gap-4">
          <Logo size={42} />
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">{t('app.name')}</div>
            <div className="text-sm text-slate-600">{t('about.desc')}</div>
            <div className="text-xs text-slate-500">{t('about.logoPlaceholder')}</div>
          </div>
        </div>
      </Modal>

      <Modal
        title={t('whatsNew.title', { version: `v${whatsNewVersion}` })}
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
          <div className="rounded-3xl border border-[var(--tf-border)] bg-gradient-to-br from-[var(--tf-accent)]/10 to-transparent p-5 dark:from-[var(--tf-accent)]/14">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('whatsNew.subtitle')}</div>
              <div className="rounded-full border border-[var(--tf-border)] bg-white/50 px-3 py-1 text-xs font-semibold text-[var(--tf-ink)] dark:bg-white/5">
                v{whatsNewVersion}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {whatsNewSections.map((s) => (
              <div
                key={s.title}
                className="rounded-3xl border border-[var(--tf-border)] bg-white/60 p-5 shadow-[var(--tf-shadow)] transition duration-200 hover:-translate-y-[0.5px] dark:bg-white/5"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--tf-accent)]" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--tf-ink)]">{s.title}</div>
                    <div className="mt-2 text-sm leading-relaxed text-[var(--tf-ink)]">{s.body}</div>
                  </div>
                </div>
                {s.bullets.length ? (
                  <ul className="mt-4 space-y-2 text-sm text-[var(--tf-ink-muted)]">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tf-accent)]/70" />
                        <span className="min-w-0">{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        title={t('updateModal.title', { version: updateStatus?.version ? `v${updateStatus.version}` : '' })}
        open={updateModalOpen}
        onClose={() => {
          const version = String(updateStatus?.version ?? '')
          if (updateStatus?.state === 'available' && version) localStorage.setItem('garageledger.updateDismissedVersion', version)
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
                  const version = String(updateStatus?.version ?? '')
                  if (version) localStorage.setItem('garageledger.updateDismissedVersion', version)
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

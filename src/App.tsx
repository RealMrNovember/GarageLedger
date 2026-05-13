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
    const saved = localStorage.getItem('garageledger.theme')
    const isDark = saved === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
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
    <div className="flex h-full">
      <Sidebar active={nav} onNavigate={setNav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          currency={currency}
          onCurrencyChange={(c) => void setCurrency(c)}
          onOpenAbout={() => setAboutOpen(true)}
        />

        <main className="min-w-0 flex-1 bg-[var(--tf-bg)] p-6">
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
        <div className="space-y-4">
          <div className="text-sm text-[var(--tf-ink-muted)]">{t('whatsNew.subtitle')}</div>
          <div className="space-y-3">
            {whatsNewSections.map((s) => (
              <div key={s.title} className="rounded-2xl border border-[var(--tf-border)] bg-white/60 p-4 dark:bg-white/5">
                <div className="text-sm font-semibold text-[var(--tf-ink)]">{s.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-[var(--tf-ink)]">{s.body}</div>
                {s.bullets.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--tf-ink-muted)]">
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}

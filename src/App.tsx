import { useMemo, useState } from 'react'
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
import { InventoryPage } from './pages/InventoryPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  const { t } = useTranslation()
  const { ready, items, currency, setCurrency, upsertItem, removeItem } = useGarageLedger()
  const categories = useMemo(() => uniqueCategories(items), [items])
  const [nav, setNav] = useState<NavKey>('dashboard')
  const [aboutOpen, setAboutOpen] = useState(false)

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
                  <DashboardPage items={items} currency={currency} />
                ) : nav === 'inventory' ? (
                  <InventoryPage
                    items={items}
                    categories={categories}
                    currency={currency}
                    onUpsert={(item) => void upsertItem(item)}
                    onRemove={(id) => void removeItem(id)}
                  />
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
    </div>
  )
}

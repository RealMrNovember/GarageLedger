import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from './Card'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={[
        'h-4 w-4 shrink-0 text-[var(--tf-ink-muted)] transition-transform duration-200',
        open ? 'rotate-180' : '',
      ].join(' ')}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CollapsibleFilterPanel({
  children,
  summary,
  actions,
  activeCount = 0,
  defaultOpen = false,
}: {
  children: ReactNode
  summary?: ReactNode
  actions?: ReactNode
  activeCount?: number
  defaultOpen?: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-[var(--tf-ink)] transition hover:bg-black/5 dark:hover:bg-white/5"
        >
          <ChevronIcon open={open} />
          <span>{open ? t('common.filters.hide') : t('common.filters.toggle')}</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-[var(--tf-accent)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--tf-accent)]">
              {t('common.filters.active', { count: activeCount })}
            </span>
          ) : null}
        </button>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3">
          {summary ? (
            <div className="truncate text-xs text-[var(--tf-ink-muted)]">{summary}</div>
          ) : null}
          {actions}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="filter-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--tf-border)] px-4 pb-4 pt-3">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  )
}

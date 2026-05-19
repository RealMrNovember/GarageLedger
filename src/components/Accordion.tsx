import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useId, useState } from 'react'

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={['h-4 w-4 shrink-0 text-[var(--tf-ink-muted)] transition-transform duration-200', open ? 'rotate-180' : ''].join(' ')}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AccordionItem({
  title,
  children,
  icon,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  icon?: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div className="gl-elevated-card overflow-hidden rounded-2xl">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
      >
        {icon ? (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70 text-[var(--tf-ink-muted)] shadow-sm dark:bg-white/5">
            {icon}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--tf-ink)]">{title}</span>
        <Chevron open={open} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--tf-border)]/50 px-4 pb-4 pt-3 text-sm leading-relaxed text-[var(--tf-ink-muted)]">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

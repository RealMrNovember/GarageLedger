import { AnimatePresence, motion } from 'framer-motion'

export type BackgroundNoticeItem = {
  id: string
  kind: 'payment' | 'fx'
  title: string
  body: string
}

type Props = {
  items: BackgroundNoticeItem[]
  onDismiss: (id: string) => void
  dismissLabel: string
}

export function BackgroundNotice({ items, onDismiss, dismissLabel }: Props) {
  return (
    <motion.div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[min(100vw-2rem,22rem)] flex-col gap-3"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/95 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            <motion.div
              className="h-1 w-full bg-gradient-to-r from-[var(--tf-accent)] via-emerald-400 to-sky-400"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ transformOrigin: 'left' }}
            />
            <motion.div className="flex gap-3 p-4">
              <div
                className={[
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                  item.kind === 'payment' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300' : 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
                ].join(' ')}
              >
                <span className="text-base leading-none" aria-hidden>
                  {item.kind === 'payment' ? '🔔' : '💱'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <motion.div className="text-sm font-semibold text-[var(--tf-ink)]">{item.title}</motion.div>
                <motion.div className="mt-1 text-xs leading-relaxed text-[var(--tf-ink-muted)]">{item.body}</motion.div>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(item.id)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[var(--tf-ink-muted)] transition hover:bg-black/5 hover:text-[var(--tf-ink)] dark:hover:bg-white/10"
                aria-label={dismissLabel}
              >
                <span aria-hidden>×</span>
              </button>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

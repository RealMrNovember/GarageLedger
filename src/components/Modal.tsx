import type { PropsWithChildren, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Card } from './Card'
import { Button } from './Button'

export function Modal({
  title,
  open,
  onClose,
  footer,
  children,
}: PropsWithChildren<{
  title: string
  open: boolean
  onClose: () => void
  footer?: ReactNode
}>) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0.9, 0.2, 1] }}
        >
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="absolute inset-0 bg-black/10 backdrop-blur-md dark:bg-black/50"
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.9 }}
            className="w-full max-w-xl"
          >
            <Card className="relative overflow-hidden bg-white/70 backdrop-blur-md dark:bg-[#1e1e1e]/75">
              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="text-sm font-semibold text-[var(--tf-ink)]">{title}</div>
                <Button variant="ghost" onClick={onClose} className="px-3">
                  {t('common.close')}
                </Button>
              </div>
              <div className="px-6 pb-6">{children}</div>
              {footer ? <div className="border-t border-[var(--tf-border)] px-6 py-4">{footer}</div> : null}
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

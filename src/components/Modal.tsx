import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Button } from './Button'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'workspace'

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-5xl',
  workspace: 'max-w-6xl min-w-[min(100%,720px)]',
}

export function Modal({
  title,
  open,
  onClose,
  footer,
  size = 'md',
  maxWidthClassName,
  draggable,
  maximizable,
  defaultMaximized,
  children,
}: PropsWithChildren<{
  title: string
  open: boolean
  onClose: () => void
  footer?: ReactNode
  size?: ModalSize
  maxWidthClassName?: string
  draggable?: boolean
  maximizable?: boolean
  defaultMaximized?: boolean
}>) {
  const { t } = useTranslation()
  const dragControls = useDragControls()
  const widthClass = maxWidthClassName?.trim() || SIZE_CLASS[size]
  const [maximized, setMaximized] = useState(Boolean(defaultMaximized))
  const isLarge = size === 'xl' || size === 'workspace'

  useEffect(() => {
    if (!open) return
    setMaximized(Boolean(defaultMaximized))
  }, [open, defaultMaximized])

  const content = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0.9, 0.2, 1] }}
        >
          <button type="button" aria-label={t('common.close')} onClick={onClose} className="gl-modal-overlay absolute inset-0" />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.9 }}
            drag={Boolean(draggable) && !maximized}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0.08}
            dragConstraints={{ top: -120, bottom: 120, left: -160, right: 160 }}
            className={[
              'relative z-10 flex w-full min-w-[min(100%,320px)] flex-col overflow-hidden rounded-2xl gl-modal-panel',
              maximized ? 'h-[calc(100vh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-none min-w-0' : widthClass,
              maximized ? 'max-h-none' : 'max-h-[min(92vh,960px)]',
            ].join(' ')}
          >
            <div
              className={[
                'gl-modal-header sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4 sm:px-6',
                draggable && !maximized ? 'cursor-grab active:cursor-grabbing' : '',
              ].join(' ')}
              onPointerDown={(e) => {
                if (!draggable || maximized) return
                dragControls.start(e)
              }}
            >
              <div className="min-w-0 pr-2">
                <div className="truncate text-sm font-semibold tracking-tight text-[var(--tf-ink)]">{title}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {maximizable ? (
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--tf-modal-border)] bg-[var(--tf-modal-surface)] text-[var(--tf-ink)] transition duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={() => setMaximized((v) => !v)}
                    aria-label={maximized ? t('common.restore') : t('common.maximize')}
                    title={maximized ? t('common.restore') : t('common.maximize')}
                  >
                    {maximized ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M7 9h10v10H7V9z" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M9 7h8V5H7v10h2V7z" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6 6h12v12H6V6z" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    )}
                  </button>
                ) : null}
                <Button variant="ghost" onClick={onClose} className="px-3">
                  {t('common.close')}
                </Button>
              </div>
            </div>

            <div
              className={[
                'gl-modal-root min-h-0 flex-1 overflow-y-auto bg-[var(--tf-modal-surface)] text-[var(--tf-ink)]',
                isLarge ? 'px-5 py-5 sm:px-7 sm:py-6' : 'px-5 py-5 sm:px-6',
              ].join(' ')}
            >
              {children}
            </div>

            {footer ? (
              <div className="gl-modal-footer sticky bottom-0 shrink-0 border-t px-5 py-4 sm:px-6">{footer}</div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return content
  return createPortal(content, document.body)
}

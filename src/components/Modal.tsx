import type { PropsWithChildren, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
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
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
      />
      <Card className="relative w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <Button variant="ghost" onClick={onClose} className="px-3">
            {t('common.close')}
          </Button>
        </div>
        <div className="px-6 pb-6">{children}</div>
        {footer ? <div className="border-t border-[var(--tf-border)] px-6 py-4">{footer}</div> : null}
      </Card>
    </div>
  )
}

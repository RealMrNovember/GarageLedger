import { useTranslation } from 'react-i18next'

export function UpdateReadyBanner({
  version,
  onRestart,
}: {
  version?: string
  onRestart: () => void
}) {
  const { t } = useTranslation()
  const label = version ? `v${version}` : ''

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] flex justify-center px-4 pb-4"
    >
      <div className="pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-50/95 via-orange-50/95 to-amber-50/95 px-4 py-3 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_12px_40px_-12px_rgba(245,158,11,0.55)] backdrop-blur-md dark:border-amber-400/25 dark:from-amber-950/90 dark:via-orange-950/85 dark:to-amber-950/90 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.12),0_16px_48px_-16px_rgba(0,0,0,0.65)]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              aria-hidden
            />
            <p className="truncate text-sm font-semibold text-amber-950 dark:text-amber-100">{t('updateBanner.title')}</p>
            {label ? (
              <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                {label}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-amber-900/80 dark:text-amber-200/80">{t('updateBanner.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="shrink-0 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 hover:shadow-md active:translate-y-px dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400"
        >
          {t('updateBanner.action')}
        </button>
      </div>
    </div>
  )
}

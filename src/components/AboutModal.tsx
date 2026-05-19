import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo } from './Logo'
import { Modal } from './Modal'

const EMAIL = 'mozkarci1991@gmail.com'
const GITHUB_URL = 'https://github.com/RealMrNovember/GarageLedger'
const WHATSAPP_URL = 'https://wa.me/905354895050'

function IconLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--tf-border)]/60 bg-white/70 text-[var(--tf-ink)] transition hover:border-[var(--tf-accent)]/40 hover:bg-black/5 dark:bg-gray-950 dark:hover:bg-white/5"
    >
      {children}
    </a>
  )
}

export function AboutModal({
  open,
  onClose,
  onOpenReleaseNotes,
}: {
  open: boolean
  onClose: () => void
  onOpenReleaseNotes?: () => void
}) {
  const { t } = useTranslation()
  const [version, setVersion] = useState('')

  useEffect(() => {
    if (!open) return
    void window.GarageLedger?.app?.getInfo?.().then((info) => {
      if (info?.version) setVersion(info.version)
    })
  }, [open])

  return (
    <Modal title={t('about.title')} open={open} onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--tf-ink)]">{t('app.name')}</h2>
              {version ? (
                <span className="rounded-full bg-[var(--tf-accent)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--tf-accent)]">
                  v{version}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--tf-ink-muted)]">{t('about.desc')}</p>
            <p className="mt-2 text-[11px] text-[var(--tf-ink-muted)]">{t('about.createdBy')}</p>
          </div>
        </div>

        {onOpenReleaseNotes ? (
          <button
            type="button"
            onClick={onOpenReleaseNotes}
            className="w-full rounded-xl border border-[var(--tf-border)]/60 bg-[var(--tf-surface)]/50 px-3 py-2 text-xs font-semibold text-[var(--tf-ink)] transition hover:border-[var(--tf-accent)]/40"
          >
            {t('about.releaseNotes')}
          </button>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <IconLink href={`mailto:${EMAIL}`} label={t('about.actions.emailTitle')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 6.5h16v11H4v-11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M4.5 7l7.5 6l7.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconLink>
          <IconLink href={GITHUB_URL} label={t('about.actions.githubTitle')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 19c-3 1-3-1-4-1m8 2v-2.2c0-.7.2-1.3.6-1.8c-2 .2-4.1-1-4.1-4.4c0-1 .3-1.8.9-2.5c-.1-.2-.4-1.2.1-2.4c0 0 .8-.2 2.6 1c.7-.2 1.5-.3 2.3-.3s1.6.1 2.3.3c1.8-1.2 2.6-1 2.6-1c.5 1.2.2 2.2.1 2.4c.6.7.9 1.5.9 2.5c0 3.4-2.1 4.6-4.1 4.4c.4.5.6 1.1.6 1.8V20"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </IconLink>
          <IconLink href={WHATSAPP_URL} label={t('about.actions.whatsappTitle')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M16.6 14.4c-.2 0-.4 0-.6-.1c-1.2-.3-2.6-1.1-3.8-2.3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path d="M7 4h10a3 3 0 0 1 3 3v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </IconLink>
        </div>

        <div className="flex flex-col gap-2 text-center">
          <a
            href={`mailto:${EMAIL}`}
            className="text-xs font-medium text-[var(--tf-ink)] underline decoration-[var(--tf-border)] underline-offset-4"
          >
            {t('about.actions.emailCta')}
          </a>
        </div>
      </div>
    </Modal>
  )
}

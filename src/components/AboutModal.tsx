import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo } from './Logo'
import { Modal } from './Modal'

const EMAIL = 'mozkarci1991@gmail.com'
const GITHUB_URL = 'https://github.com/RealMrNovember/GarageLedger'
const WHATSAPP_URL = 'https://wa.me/905354895050'

function ContactCard({
  icon,
  title,
  description,
  cta,
  href,
  primary,
}: {
  icon: ReactNode
  title: string
  description: string
  cta: string
  href: string
  primary?: boolean
}) {
  return (
    <div className="group rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/40 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--tf-accent)]/25 hover:shadow-md dark:bg-gray-900/80">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--tf-border)] bg-white text-[var(--tf-ink)] shadow-sm dark:bg-gray-950">
            {icon}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-[var(--tf-ink)]">{title}</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--tf-ink-muted)]">{description}</div>
          </div>
        </div>
        <a
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noreferrer' : undefined}
          className={[
            'inline-flex shrink-0 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-200',
            primary
              ? 'bg-[var(--tf-accent)] text-white shadow-sm hover:-translate-y-0.5 hover:bg-black/90 hover:shadow-md dark:text-black dark:hover:bg-[#b89145]'
              : 'border border-[var(--tf-border)] bg-white text-[var(--tf-ink)] hover:bg-black/5 dark:bg-gray-950 dark:hover:bg-white/5',
          ].join(' ')}
        >
          {cta}
        </a>
      </div>
    </div>
  )
}

export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const [version, setVersion] = useState('')

  useEffect(() => {
    if (!open) return
    void window.GarageLedger?.app?.getInfo?.().then((info) => {
      if (info?.version) setVersion(info.version)
    })
  }, [open])

  return (
    <Modal title={t('about.title')} open={open} onClose={onClose} maxWidthClassName="max-w-2xl">
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--tf-border)] bg-gradient-to-br from-[var(--tf-surface)]/80 to-white p-6 shadow-sm dark:from-gray-900 dark:to-gray-950">
          <div className="flex items-start gap-4">
            <Logo size={52} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-[var(--tf-ink)]">{t('app.name')}</h2>
                {version ? (
                  <span className="rounded-full border border-[var(--tf-border)] bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--tf-ink-muted)] dark:bg-gray-950">
                    {t('about.version', { version })}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--tf-ink-muted)]">{t('about.desc')}</p>
              <p className="mt-4 text-xs font-medium text-[var(--tf-ink-muted)]">{t('about.createdBy')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <ContactCard
            primary
            title={t('about.actions.emailTitle')}
            description={t('about.actions.emailDesc')}
            cta={t('about.actions.emailCta')}
            href={`mailto:${EMAIL}`}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6.5h16v11H4v-11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M4.5 7l7.5 6l7.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <ContactCard
            title={t('about.actions.githubTitle')}
            description={t('about.actions.githubDesc')}
            cta={t('about.actions.githubCta')}
            href={GITHUB_URL}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 19c-3 1-3-1-4-1m8 2v-2.2c0-.7.2-1.3.6-1.8c-2 .2-4.1-1-4.1-4.4c0-1 .3-1.8.9-2.5c-.1-.2-.4-1.2.1-2.4c0 0 .8-.2 2.6 1c.7-.2 1.5-.3 2.3-.3s1.6.1 2.3.3c1.8-1.2 2.6-1 2.6-1c.5 1.2.2 2.2.1 2.4c.6.7.9 1.5.9 2.5c0 3.4-2.1 4.6-4.1 4.4c.4.5.6 1.1.6 1.8V20"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <ContactCard
            title={t('about.actions.whatsappTitle')}
            description={t('about.actions.whatsappDesc')}
            cta={t('about.actions.whatsappCta')}
            href={WHATSAPP_URL}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M16.6 14.4c-.2 0-.4 0-.6-.1c-1.2-.3-2.6-1.1-3.8-2.3c-1.2-1.2-2-2.6-2.3-3.8c-.2-.8.1-1.5.8-1.9l1.1-.6c.6-.3 1.3-.2 1.8.3l1 1.1c.4.5.5 1.2.2 1.8l-.3.6c.6 1 1.4 1.9 2.3 2.7c.9.9 1.8 1.7 2.7 2.3l.6-.3c.6-.3 1.3-.2 1.8.2l1.1 1c.5.5.6 1.2.3 1.8l-.6 1.1c-.3.6-.9.9-1.5.9c-.2 0-.3 0-.5 0c-1.3-.2-2.8-1-4.3-2.2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M7 4h10a3 3 0 0 1 3 3v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
      </div>
    </Modal>
  )
}

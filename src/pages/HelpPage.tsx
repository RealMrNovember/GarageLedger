import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HelpTopicCard } from '../components/HelpTopicCard'

type HelpSection = {
  title: string
  body: string
  bullets?: string[]
}

function parseSections(raw: unknown): HelpSection[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((x) => x && typeof x === 'object')
    .map((x) => {
      const obj = x as Record<string, unknown>
      return {
        title: String(obj.title ?? ''),
        body: String(obj.body ?? ''),
        bullets: Array.isArray(obj.bullets) ? (obj.bullets as unknown[]).map((b) => String(b)) : [],
      }
    })
    .filter((s) => s.title)
}

function FaqIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 18h.01M8.5 8.5a3.5 3.5 0 1 1 6.2 2.2c-.9.5-1.4 1-1.7 1.8-.2.5-.3.8-.5 1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function ContactLink({ label, href, children }: { label: string; href: string; children: string }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className="mt-2 inline-block text-sm font-semibold text-[var(--tf-ink)] underline decoration-[var(--tf-border)] underline-offset-4 transition duration-200 group-hover:decoration-[var(--tf-accent)]"
    >
      <span className="sr-only">{label}: </span>
      {children}
    </a>
  )
}

export function HelpPage() {
  const { t } = useTranslation()

  const { guide, faq } = useMemo(() => {
    const booklet = t('help.booklet', { returnObjects: true }) as Record<string, unknown>
    const guideRaw = booklet?.guide ?? booklet?.sections
    const faqRaw = booklet?.faq
    const all = parseSections(guideRaw)
    const faqSections = parseSections(faqRaw)
    if (faqSections.length) {
      return { guide: all, faq: faqSections }
    }
    const splitAt = Math.min(6, all.length)
    return { guide: all.slice(0, splitAt), faq: all.slice(splitAt) }
  }, [t])

  const contacts = [
    { key: 'developer', href: '', value: 'Mikail | Cicibyte Corp', external: false },
    { key: 'github', href: 'https://github.com/RealMrNovember', value: 'RealMrNovember', external: true },
    { key: 'email', href: 'mailto:mozkarci1991@gmail.com', value: 'mozkarci1991@gmail.com', external: false },
    { key: 'whatsapp', href: 'https://wa.me/905354895050', value: '+90 535 489 50 50', external: true },
  ] as const

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/80 px-6 py-5 shadow-[var(--tf-shadow)]">
        <div className="text-lg font-semibold tracking-tight text-[var(--tf-ink)]">{t('help.title')}</div>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--tf-ink-muted)]">{t('help.subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:items-start">
        <section className="space-y-4" aria-labelledby="help-guide-heading">
          <div id="help-guide-heading">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tf-accent)]">
              {t('help.guide.kicker')}
            </div>
            <h2 className="mt-1 text-base font-semibold text-[var(--tf-ink)]">{t('help.guide.title')}</h2>
            <p className="mt-1 text-sm text-[var(--tf-ink-muted)]">{t('help.guide.subtitle')}</p>
          </div>
          <div className="space-y-3">
            {guide.map((s, index) => (
              <HelpTopicCard key={s.title} step={index + 1} title={s.title} body={s.body} bullets={s.bullets} />
            ))}
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="help-faq-heading">
          <div id="help-faq-heading">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tf-accent)]">
              {t('help.faq.kicker')}
            </div>
            <h2 className="mt-1 text-base font-semibold text-[var(--tf-ink)]">{t('help.faq.title')}</h2>
            <p className="mt-1 text-sm text-[var(--tf-ink-muted)]">{t('help.faq.subtitle')}</p>
          </div>
          <div className="space-y-3">
            {faq.map((s) => (
              <HelpTopicCard
                key={s.title}
                icon={<FaqIcon />}
                title={s.title}
                body={s.body}
                bullets={s.bullets}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-4" aria-labelledby="help-contact-heading">
        <div id="help-contact-heading">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tf-ink-muted)]">
            {t('help.contact.kicker')}
          </div>
          <h2 className="mt-1 text-base font-semibold text-[var(--tf-ink)]">{t('help.contact.title')}</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {contacts.map((c) => (
            <article
              key={c.key}
              className="group rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)] p-5 shadow-[var(--tf-shadow)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--tf-accent)]/35 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/25"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--tf-ink-muted)]">
                {t(`help.contact.${c.key}`)}
              </div>
              {c.href ? (
                <ContactLink label={t(`help.contact.${c.key}`)} href={c.href}>
                  {c.value}
                </ContactLink>
              ) : (
                <div className="mt-2 text-sm font-semibold text-[var(--tf-ink)]">{c.value}</div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

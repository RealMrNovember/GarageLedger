import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AccordionItem } from '../components/Accordion'
import { PageShell } from '../components/PageShell'

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

function GuideIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l3 3v15H7V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 11h7M10 15h7M10 7h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SectionBody({ body, bullets }: { body: string; bullets?: string[] }) {
  return (
    <div className="space-y-3">
      {body ? <p>{body}</p> : null}
      {bullets && bullets.length > 0 ? (
        <ul className="space-y-1.5">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--tf-accent)]" aria-hidden="true" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function HelpPage({ onOpenReleaseNotes }: { onOpenReleaseNotes?: () => void }) {
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
    { key: 'developer', href: '', value: 'Mikail | Cicibyte Corp' },
    { key: 'github', href: 'https://github.com/RealMrNovember', value: 'RealMrNovember' },
    { key: 'email', href: 'mailto:mozkarci1991@gmail.com', value: 'mozkarci1991@gmail.com' },
    { key: 'whatsapp', href: 'https://wa.me/905354895050', value: '+90 535 489 50 50' },
  ] as const

  return (
    <PageShell
      title={t('help.title')}
      subtitle={t('help.subtitle')}
      actions={
        onOpenReleaseNotes ? (
          <button
            type="button"
            onClick={onOpenReleaseNotes}
            className="rounded-xl border border-[var(--tf-border)]/60 bg-white/80 px-3 py-2 text-xs font-semibold text-[var(--tf-ink)] shadow-sm transition hover:border-[var(--tf-accent)]/40 dark:bg-gray-950"
          >
            {t('help.openReleaseNotes')}
          </button>
        ) : null
      }
    >
      <div className="mx-auto grid w-full max-w-3xl gap-8">
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tf-accent)]">{t('help.guide.kicker')}</p>
            <h2 className="mt-1 text-sm font-semibold text-[var(--tf-ink)]">{t('help.guide.title')}</h2>
          </div>
          <div className="space-y-2">
            {guide.map((s, index) => (
              <AccordionItem
                key={s.title}
                title={s.title}
                icon={<GuideIcon />}
                defaultOpen={index === 0}
              >
                <SectionBody body={s.body} bullets={s.bullets} />
              </AccordionItem>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tf-accent)]">{t('help.faq.kicker')}</p>
            <h2 className="mt-1 text-sm font-semibold text-[var(--tf-ink)]">{t('help.faq.title')}</h2>
          </div>
          <div className="space-y-2">
            {faq.map((s) => (
              <AccordionItem key={s.title} title={s.title} icon={<FaqIcon />}>
                <SectionBody body={s.body} bullets={s.bullets} />
              </AccordionItem>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tf-ink-muted)]">{t('help.contact.title')}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {contacts.map((c) => (
              <div key={c.key} className="gl-elevated-card rounded-xl px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tf-ink-muted)]">
                  {t(`help.contact.${c.key}`)}
                </div>
                {c.href ? (
                  <a
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
                    className="mt-1 block truncate text-sm font-medium text-[var(--tf-ink)] underline decoration-[var(--tf-border)] underline-offset-4 hover:decoration-[var(--tf-accent)]"
                  >
                    {c.value}
                  </a>
                ) : (
                  <div className="mt-1 text-sm font-medium text-[var(--tf-ink)]">{c.value}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  )
}

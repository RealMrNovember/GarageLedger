import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/Card'

type HelpSection = {
  title: string
  body: string
  bullets?: string[]
}

export function HelpPage() {
  const { t } = useTranslation()

  const sections = useMemo(() => {
    const raw = t('help.booklet.sections', { returnObjects: true }) as unknown
    if (!Array.isArray(raw)) return []
    return raw
      .filter((x) => x && typeof x === 'object')
      .map((x) => {
        const obj = x as Record<string, unknown>
        return {
          title: String(obj.title ?? ''),
          body: String(obj.body ?? ''),
          bullets: Array.isArray(obj.bullets) ? (obj.bullets as unknown[]).map((b) => String(b)) : [],
        } satisfies HelpSection
      })
      .filter((s) => s.title)
  }, [t])

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('help.title')}</div>
        <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('help.subtitle')}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.title} className="p-5">
            <div className="text-sm font-semibold text-[var(--tf-ink)]">{s.title}</div>
            <div className="mt-2 text-sm leading-relaxed text-[var(--tf-ink)]">{s.body}</div>
            {s.bullets && s.bullets.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--tf-ink)]">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </Card>
        ))}
      </div>

      <div className="pt-2">
        <div className="text-xs font-semibold tracking-wide text-[var(--tf-ink-muted)]">{t('help.contact.title')}</div>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5">
            <div className="text-xs font-semibold text-[var(--tf-ink-muted)]">{t('help.contact.developer')}</div>
            <div className="mt-2 text-sm font-semibold text-[var(--tf-ink)]">Mikail | Cicibyte Corp</div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-semibold text-[var(--tf-ink-muted)]">{t('help.contact.github')}</div>
            <a
              href="https://github.com/RealMrNovember"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-[var(--tf-ink)] underline decoration-[var(--tf-border)] underline-offset-4 hover:decoration-[var(--tf-ink-muted)]"
            >
              RealMrNovember
            </a>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-semibold text-[var(--tf-ink-muted)]">{t('help.contact.email')}</div>
            <a
              href="mailto:mozkarci1991@gmail.com"
              className="mt-2 inline-block text-sm font-semibold text-[var(--tf-ink)] underline decoration-[var(--tf-border)] underline-offset-4 hover:decoration-[var(--tf-ink-muted)]"
            >
              mozkarci1991@gmail.com
            </a>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-semibold text-[var(--tf-ink-muted)]">{t('help.contact.whatsapp')}</div>
            <a
              href="https://wa.me/905354895050"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-[var(--tf-ink)] underline decoration-[var(--tf-border)] underline-offset-4 hover:decoration-[var(--tf-ink-muted)]"
            >
              +90 535 489 50 50
            </a>
          </Card>
        </div>
      </div>
    </div>
  )
}

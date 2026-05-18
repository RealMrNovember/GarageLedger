import fs from 'fs'

const p = new URL('../src/pages/SettingsPage.tsx', import.meta.url)
let s = fs.readFileSync(p, 'utf8')

const marker = "      <SettingsSectionTitle>{t('settings.sections.fx')}</SettingsSectionTitle>"
const start = s.indexOf(marker)
if (start < 0) throw new Error('fx section not found')

const feedbackTitle = "settings.sections.feedback"
const end = s.indexOf(feedbackTitle, start)
if (end < 0) throw new Error('feedback section not found')
const sliceEnd = s.lastIndexOf('<SettingsDivider', end)

const d = 'div'
const block = `${marker}
      <Card className="p-5">
        <${d} className="max-w-md">
          <${d} className="text-xs font-medium text-[var(--tf-ink-muted)]">{t('settings.currency')}</${d}>
          <select
            value={(settings.currency ?? 'AZN') as CurrencyCode}
            onChange={(e) => void onUpdateSettings({ currency: e.target.value as CurrencyCode })}
            className="mt-3 w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <${d} className="mt-2 text-xs text-[var(--tf-ink-muted)]">
            {t('settings.fx.last', {
              value: fxFetchedAt ? formatFxDisplayTime(fxFetchedAt, i18n.language) : '—',
            })}
          </${d}>
          <${d} className="mt-3">
            <Button variant="ghost" onClick={() => void refreshFxRates({ force: true, mode: fxMode })}>
              {t('settings.fx.refresh')}
            </Button>
          </${d}>
        </${d}>
      </Card>

`

s = s.slice(0, start) + block + s.slice(sliceEnd)
fs.writeFileSync(p, s)
console.log('ok')

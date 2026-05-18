import fs from 'fs'

const p = new URL('../src/components/Sidebar.tsx', import.meta.url)
let s = fs.readFileSync(p, 'utf8')

const start = s.indexOf('      <motion-safe-label className="mt-auto">')
const start2 = s.indexOf('      <div className="mt-auto">')
const st = start >= 0 ? start : start2
const end = s.indexOf('    </aside>', st)

const f = `      <div className="mt-auto">
        <div className="rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)] p-3 shadow-[var(--tf-shadow)]">
          {!collapsed ? (
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--tf-ink-muted)]">
                {t('settings.theme.title')}
              </span>
              <span className={\`truncate text-[11px] font-medium \${fxStatusClass}\`} title={fxStatusText}>
                {fxStatusText}
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onRefreshFx()}
              className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--tf-border)] bg-white/50 px-2 text-[var(--tf-ink)] transition duration-200 hover:bg-black/5 dark:bg-white/5 dark:hover:bg-white/10"
              aria-label={t('settings.fx.refresh')}
              title={t('settings.fx.refresh')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M20 5v4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 19v-4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!collapsed ? <span className="truncate text-xs font-medium">{t('settings.fx.refresh')}</span> : null}
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="relative inline-flex h-9 w-14 shrink-0 items-center rounded-full border border-[var(--tf-border)] bg-white/50 px-1 transition duration-200 hover:bg-black/5 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <span className="sr-only">{t('settings.theme.toggle')}</span>
              <span className={['inline-block h-7 w-7 rounded-full bg-[var(--tf-accent)] shadow-sm transition duration-200', theme === 'dark' ? 'translate-x-5' : 'translate-x-0'].join(' ')} />
            </button>
          </div>
          {collapsed ? (
            <div className={\`mt-2 text-center text-[10px] font-medium \${fxStatusClass}\`} title={fxStatusText}>
              {fxFetchedAt ? timeLabel : '—'}
            </div>
          ) : null}
        </div>
      </div>
`

s = s.slice(0, st) + f + s.slice(end)
fs.writeFileSync(p, s)
console.log('ok', st, end)

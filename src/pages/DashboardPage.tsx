import { ResponsiveContainer, Area, AreaChart, Bar, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { StatCard } from '../components/StatCard'
import { formatMoney } from '../lib/currency'
import { sixMonthSalesSeries, thisMonthInvestment, thisMonthNetProfit, thisMonthPurchasedCount, thisMonthRevenue, weeklyProfitSeries } from '../lib/compute'
import type { CurrencyCode } from '../lib/currency'
import type { TradeItem } from '../lib/types'
import { i18n } from '../i18n'
import { addDays, parseIsoDate, toIsoDateInputValue } from '../lib/dates'

function formatVehicle(item: TradeItem): string {
  const brand = (item.brand ?? '').trim()
  const model = (item.model ?? '').trim()
  const year = item.year == null ? '' : String(item.year)
  const head = [brand, model].filter(Boolean).join(' ')
  return [head, year].filter(Boolean).join(' · ') || '—'
}

export function DashboardPage({
  items,
  currency,
  onUpsert,
}: {
  items: TradeItem[]
  currency: CurrencyCode
  onUpsert: (item: TradeItem) => void
}) {
  const { t } = useTranslation()
  const isDark = document.documentElement.classList.contains('dark')
  const axis = isDark ? '#d1d5db' : '#475569'
  const grid = isDark ? 'rgba(209,213,219,0.12)' : 'rgba(15,23,42,0.07)'
  const tooltipBg = isDark ? 'rgba(17,24,39,0.94)' : 'rgba(250,250,250,0.95)'
  const tooltipBorder = isDark ? '1px solid rgba(55,65,81,0.9)' : '1px solid rgba(15,23,42,0.08)'
  const ink = isDark ? '#f3f4f6' : '#111827'
  const series = isDark ? '#c8a45a' : '#111827'
  const purchasedCount = thisMonthPurchasedCount(items)
  const investment = thisMonthInvestment(items)
  const revenue = thisMonthRevenue(items)
  const netProfit = thisMonthNetProfit(items)
  const weekly = weeklyProfitSeries(items)
  const sixMonths = sixMonthSalesSeries(items, new Date(), i18n.language)
  const pending = useMemo(() => {
    return items
      .filter((x) => x.status === 'sold' && (x.remainingBalance ?? 0) > 0)
      .slice()
      .sort((a, b) => {
        const ad = a.nextPaymentDate ?? '9999-12-31'
        const bd = b.nextPaymentDate ?? '9999-12-31'
        return ad.localeCompare(bd)
      })
  }, [items])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t('dashboard.stats.purchasedCount')} value={String(purchasedCount)} tone="count" />
        <StatCard label={t('dashboard.stats.monthInvestment')} value={formatMoney(investment, currency)} />
        <StatCard label={t('dashboard.stats.monthRevenue')} value={formatMoney(revenue, currency)} />
        <StatCard
          label={t('dashboard.stats.monthNetProfit')}
          value={formatMoney(netProfit, currency)}
          tone="profit"
        />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('reminders.title')}</div>
            <div className="mt-1 text-xs text-[var(--tf-ink-muted)]">{t('reminders.subtitle')}</div>
          </div>
          <div className="text-xs text-[var(--tf-ink-muted)]">{t('reminders.count', { count: pending.length })}</div>
        </div>

        {pending.length === 0 ? (
          <div className="mt-4 text-sm text-[var(--tf-ink-muted)]">{t('reminders.empty')}</div>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map((item) => {
              const remaining = Number(item.remainingBalance ?? 0)
              const buyer = [item.buyerName, item.buyerPhone].filter(Boolean).join(' · ')
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--tf-border)] bg-white/60 p-4 md:flex-row md:items-center md:justify-between dark:bg-white/5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--tf-ink)]">{formatVehicle(item)}</div>
                    <div className="mt-1 truncate text-xs text-[var(--tf-ink-muted)]">
                      {t('reminders.line', {
                        remaining: formatMoney(remaining, currency),
                        nextDate: item.nextPaymentDate ?? '—',
                        party: buyer || '—',
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const raw = window.prompt(t('reminders.collectPrompt', { remaining: String(remaining) }))
                        if (!raw) return
                        const amount = Number(raw)
                        if (!Number.isFinite(amount) || amount <= 0) return
                        const nextRemaining = Math.max(0, remaining - amount)
                        onUpsert({
                          ...item,
                          remainingBalance: nextRemaining,
                          nextPaymentDate: nextRemaining > 0 ? item.nextPaymentDate : null,
                        })
                      }}
                    >
                      {t('reminders.collect')}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        const base = item.nextPaymentDate ? parseIsoDate(item.nextPaymentDate) : new Date()
                        onUpsert({ ...item, nextPaymentDate: toIsoDateInputValue(addDays(base, 1)) })
                      }}
                    >
                      {t('reminders.snooze1d')}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const base = item.nextPaymentDate ? parseIsoDate(item.nextPaymentDate) : new Date()
                        onUpsert({ ...item, nextPaymentDate: toIsoDateInputValue(addDays(base, 3)) })
                      }}
                    >
                      {t('reminders.snooze3d')}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const base = item.nextPaymentDate ? parseIsoDate(item.nextPaymentDate) : new Date()
                        onUpsert({ ...item, nextPaymentDate: toIsoDateInputValue(addDays(base, 7)) })
                      }}
                    >
                      {t('reminders.snooze1w')}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('dashboard.charts.weekly')}</div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isDark ? 'rgba(200,164,90,0.42)' : 'rgba(17,24,39,0.35)'} />
                    <stop offset="100%" stopColor={isDark ? 'rgba(200,164,90,0.04)' : 'rgba(17,24,39,0.02)'} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: tooltipBorder,
                    background: tooltipBg,
                    color: ink,
                  }}
                  formatter={(v) => formatMoney(Number(v), currency)}
                />
                <Area type="monotone" dataKey="value" stroke={series} strokeWidth={2} fill="url(#profit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold text-[var(--tf-ink)]">{t('dashboard.charts.sixMonth')}</div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sixMonths} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: axis, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: axis, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: tooltipBorder,
                    background: tooltipBg,
                    color: ink,
                  }}
                  formatter={(v, name) => {
                    if (name === 'profit') return formatMoney(Number(v), currency)
                    return String(v)
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="soldCount"
                  barSize={18}
                  radius={[10, 10, 10, 10]}
                  fill={isDark ? 'rgba(209,213,219,0.18)' : 'rgba(17, 24, 39, 0.18)'}
                />
                <Line yAxisId="right" type="monotone" dataKey="profit" stroke={series} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

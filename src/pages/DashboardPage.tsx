import { ResponsiveContainer, Area, AreaChart, Bar, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/Card'
import { StatCard } from '../components/StatCard'
import { formatMoney } from '../lib/currency'
import { sixMonthSalesSeries, thisMonthInvestment, thisMonthNetProfit, thisMonthPurchasedCount, thisMonthRevenue, weeklyProfitSeries } from '../lib/compute'
import type { CurrencyCode } from '../lib/currency'
import type { TradeItem } from '../lib/types'
import { i18n } from '../i18n'

export function DashboardPage({ items, currency }: { items: TradeItem[]; currency: CurrencyCode }) {
  const { t } = useTranslation()
  const purchasedCount = thisMonthPurchasedCount(items)
  const investment = thisMonthInvestment(items)
  const revenue = thisMonthRevenue(items)
  const netProfit = thisMonthNetProfit(items)
  const weekly = weeklyProfitSeries(items)
  const sixMonths = sixMonthSalesSeries(items, new Date(), i18n.language)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <StatCard label={t('dashboard.stats.purchasedCount')} value={String(purchasedCount)} />
        <StatCard label={t('dashboard.stats.monthInvestment')} value={formatMoney(investment, currency)} />
        <StatCard label={t('dashboard.stats.monthRevenue')} value={formatMoney(revenue, currency)} />
        <StatCard label={t('dashboard.stats.monthNetProfit')} value={formatMoney(netProfit, currency)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-900">{t('dashboard.charts.weekly')}</div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(17, 24, 39, 0.35)" />
                    <stop offset="100%" stopColor="rgba(17, 24, 39, 0.02)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(15,23,42,0.07)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: '1px solid rgba(15,23,42,0.08)',
                    background: 'rgba(250,250,250,0.95)',
                  }}
                  formatter={(v) => formatMoney(Number(v), currency)}
                />
                <Area type="monotone" dataKey="value" stroke="#111827" strokeWidth={2} fill="url(#profit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-900">{t('dashboard.charts.sixMonth')}</div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sixMonths} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(15,23,42,0.07)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: '1px solid rgba(15,23,42,0.08)',
                    background: 'rgba(250,250,250,0.95)',
                  }}
                  formatter={(v, name) => {
                    if (name === 'profit') return formatMoney(Number(v), currency)
                    return String(v)
                  }}
                />
                <Bar yAxisId="left" dataKey="soldCount" barSize={18} radius={[10, 10, 10, 10]} fill="rgba(17, 24, 39, 0.18)" />
                <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#111827" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

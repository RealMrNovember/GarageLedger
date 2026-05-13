import { ResponsiveContainer, Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/Card'
import { StatCard } from '../components/StatCard'
import { formatMoney } from '../lib/currency'
import { activeInvestment, isInStock, monthlyProfitSeries, thisMonthProfit, weeklyProfitSeries } from '../lib/compute'
import type { CurrencyCode } from '../lib/currency'
import type { TradeItem } from '../lib/types'

export function DashboardPage({ items, currency }: { items: TradeItem[]; currency: CurrencyCode }) {
  const { t } = useTranslation()
  const activeCount = items.filter(isInStock).length
  const investment = activeInvestment(items)
  const monthProfit = thisMonthProfit(items)
  const weekly = weeklyProfitSeries(items)
  const monthly = monthlyProfitSeries(items)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard label={t('dashboard.stats.activeCount')} value={String(activeCount)} />
        <StatCard label={t('dashboard.stats.investment')} value={formatMoney(investment, currency)} />
        <StatCard label={t('dashboard.stats.monthProfit')} value={formatMoney(monthProfit, currency)} />
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
          <div className="text-sm font-semibold text-slate-900">{t('dashboard.charts.monthly')}</div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitMonthly" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="value" stroke="#111827" strokeWidth={2} fill="url(#profitMonthly)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

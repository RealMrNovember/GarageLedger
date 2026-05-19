import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from './Badge'
import { formatMoney, type CurrencyCode } from '../lib/currency'
import { itemProfit, isInStock, reservedRemainingBalance } from '../lib/compute'
import { toIsoDateInputValue } from '../lib/dates'
import type { TradeItem } from '../lib/types'

function formatVehicle(item: TradeItem): string {
  const parts: string[] = []
  const brand = (item.brand ?? '').trim()
  const model = (item.model ?? '').trim()
  const engine = (item.engine ?? '').trim()
  const year = item.year == null ? '' : String(item.year)

  const head = [brand, model].filter(Boolean).join(' ')
  if (head) parts.push(head)
  if (year) parts.push(year)
  if (engine) parts.push(engine)

  if (parts.length >= 2) {
    const [a, b, ...rest] = parts
    const left = `${a} - ${b}`
    return rest.length ? `${left}, ${rest.join(', ')}` : left
  }
  return parts.join(', ') || '—'
}

const iconBtnBase =
  'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/80 text-[var(--tf-ink)] shadow-sm transition duration-200 hover:-translate-y-px hover:border-black/15 hover:bg-black/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-accent)]/40 dark:hover:border-white/15 dark:hover:bg-white/10'

function EditIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4l10.6-10.6a1.5 1.5 0 0 0 0-2.1L16.7 4.4a1.5 1.5 0 0 0-2.1 0L4 15v5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13.5 5.5l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SoldIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 7L10 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 7l1 14h6l1-14" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function rowCell(extra = '') {
  return [
    'px-4 py-3.5 align-middle text-sm transition duration-200',
    'bg-[var(--tf-surface)]/55 group-hover:bg-[var(--tf-surface)]/95 group-hover:shadow-[0_8px_24px_-20px_rgba(0,0,0,0.35)]',
    extra,
  ]
    .filter(Boolean)
    .join(' ')
}

type Props = {
  items: TradeItem[]
  currency: CurrencyCode
  onEdit: (item: TradeItem) => void
  onMarkSold: (item: TradeItem) => void
  onDeleteRequest: (item: TradeItem) => void
}

export function InventoryTable({ items, currency, onEdit, onMarkSold, onDeleteRequest }: Props) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  const updateEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({
      left: el.scrollLeft > 6,
      right: max > 6 && el.scrollLeft < max - 6,
    })
  }, [])

  useEffect(() => {
    updateEdges()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateEdges, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateEdges) : null
    ro?.observe(el)
    window.addEventListener('resize', updateEdges)
    return () => {
      el.removeEventListener('scroll', updateEdges)
      ro?.disconnect()
      window.removeEventListener('resize', updateEdges)
    }
  }, [items.length, updateEdges])

  const thClass =
    'sticky top-0 z-20 whitespace-nowrap bg-[var(--tf-bg)]/95 px-4 py-3.5 text-left text-xs font-semibold tracking-wide text-[var(--tf-ink-muted)] backdrop-blur-md shadow-[inset_0_-1px_0_var(--tf-border)]'

  return (
    <div className="relative">
      {edges.left ? (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-30 w-10 bg-gradient-to-r from-[var(--tf-surface)] via-[var(--tf-surface)]/80 to-transparent"
          aria-hidden
        />
      ) : null}
      {edges.right ? (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-30 w-10 bg-gradient-to-l from-[var(--tf-surface)] via-[var(--tf-surface)]/80 to-transparent"
          aria-hidden
        />
      ) : null}

      <div
        ref={scrollRef}
        className="gl-inventory-scroll max-h-[calc(100vh-12rem)] overflow-auto overscroll-x-contain scroll-smooth"
        tabIndex={0}
        role="region"
        aria-label={t('inventory.table.region')}
      >
        <table className="w-full min-w-[1080px] border-separate border-spacing-y-2 px-3 pb-3 text-left">
          <thead>
            <tr>
              <th className={[thClass, 'rounded-tl-xl pl-5'].join(' ')}>{t('inventory.table.vehicle')}</th>
              <th className={thClass}>{t('inventory.table.category')}</th>
              <th className={thClass}>{t('inventory.table.purchaseDate')}</th>
              <th className={thClass}>{t('inventory.table.saleDate')}</th>
              <th className={thClass}>{t('inventory.table.purchasePrice')}</th>
              <th className={thClass}>{t('inventory.table.salePrice')}</th>
              <th className={thClass}>{t('inventory.table.profit')}</th>
              <th
                className={[
                  thClass,
                  'sticky right-0 z-30 min-w-[7.5rem] rounded-tr-xl pr-5 text-right shadow-[-8px_0_16px_-12px_rgba(0,0,0,0.12)] dark:shadow-[-8px_0_16px_-12px_rgba(0,0,0,0.45)]',
                ].join(' ')}
              >
                {t('inventory.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="rounded-2xl bg-[var(--tf-surface)]/40 px-5 py-10 text-center text-sm text-[var(--tf-ink-muted)]" colSpan={8}>
                  {t('inventory.empty')}
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const inStock = isInStock(item)
                const profit = itemProfit(item)
                const profitTone: 'neutral' | 'good' | 'bad' | 'info' =
                  profit == null ? 'info' : profit > 0 ? 'good' : profit < 0 ? 'bad' : 'neutral'
                const remaining = reservedRemainingBalance(item)

                return (
                  <tr key={item.id} className="group">
                    <td className={rowCell('rounded-l-2xl pl-5')}>
                      <div className="font-medium text-[var(--tf-ink)]">{formatVehicle(item)}</div>
                      {item.status === 'reserved' ? (
                        <div className="mt-2">
                          <Badge tone="neutral">{t('inventory.badge.reserved')}</Badge>
                        </div>
                      ) : inStock ? (
                        <div className="mt-2">
                          <Badge tone="info">{t('inventory.badge.inStock')}</Badge>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <Badge tone="good">{t('inventory.badge.sold')}</Badge>
                        </div>
                      )}
                      {item.status === 'reserved' ? (
                        <div className="mt-2 text-xs text-[var(--tf-ink-muted)]">
                          {t('inventory.reserved.line', {
                            deposit: formatMoney(item.deposit ?? 0, currency),
                            remaining: remaining == null ? '—' : formatMoney(remaining, currency),
                          })}
                        </div>
                      ) : null}
                    </td>
                    <td className={rowCell('text-[var(--tf-ink-muted)]')}>{item.category}</td>
                    <td className={rowCell('whitespace-nowrap text-[var(--tf-ink-muted)]')}>{item.purchaseDate}</td>
                    <td className={rowCell('whitespace-nowrap text-[var(--tf-ink-muted)]')}>{item.sellDate ?? '—'}</td>
                    <td className={rowCell('whitespace-nowrap font-medium text-[var(--tf-ink)]')}>
                      {formatMoney(item.purchasePrice, currency)}
                    </td>
                    <td className={rowCell('whitespace-nowrap font-medium text-[var(--tf-ink)]')}>
                      {item.sellPrice == null ? '—' : formatMoney(item.sellPrice, currency)}
                    </td>
                    <td className={rowCell()}>
                      {profit == null ? (
                        <Badge tone="info">—</Badge>
                      ) : (
                        <Badge tone={profitTone}>{formatMoney(profit, currency)}</Badge>
                      )}
                    </td>
                    <td
                      className={rowCell(
                        'sticky right-0 rounded-r-2xl pr-5 text-right shadow-[-10px_0_20px_-14px_rgba(0,0,0,0.1)] group-hover:shadow-[-10px_0_24px_-14px_rgba(0,0,0,0.18)] dark:shadow-[-10px_0_20px_-14px_rgba(0,0,0,0.35)]',
                      )}
                    >
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={t('inventory.actions.edit')}
                          title={t('inventory.actions.edit')}
                          className={iconBtnBase}
                          onClick={() => onEdit(item)}
                        >
                          <EditIcon />
                        </button>
                        {inStock ? (
                          <button
                            type="button"
                            aria-label={t('inventory.actions.markSold')}
                            title={t('inventory.actions.markSold')}
                            className={iconBtnBase}
                            onClick={() =>
                              onMarkSold({
                                ...item,
                                status: 'sold',
                                reserveDate: null,
                                deposit: null,
                                sellDate: item.sellDate ?? toIsoDateInputValue(new Date()),
                                sellPrice: item.sellPrice ?? 0,
                              })
                            }
                          >
                            <SoldIcon />
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={t('inventory.actions.delete')}
                            title={t('inventory.actions.delete')}
                            className={`${iconBtnBase} text-rose-700 hover:border-rose-500/30 hover:bg-rose-600/10 dark:text-rose-300 dark:hover:bg-rose-400/10`}
                            onClick={() => onDeleteRequest(item)}
                          >
                            <DeleteIcon />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {edges.right ? (
        <div className="pointer-events-none absolute bottom-2 right-4 z-30 rounded-full border border-[var(--tf-border)] bg-[var(--tf-surface)]/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[var(--tf-ink-muted)] shadow-sm backdrop-blur-sm">
          {t('inventory.table.scrollHint')}
        </div>
      ) : null}
    </div>
  )
}

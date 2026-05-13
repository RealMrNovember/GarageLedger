import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { toIsoDateInputValue } from '../lib/dates'
import type { TradeItem } from '../lib/types'

function newId(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return String(Date.now())
}

export function TradeFormModal({
  open,
  onClose,
  categories,
  initial,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  categories: string[]
  initial?: TradeItem
  onSubmit: (item: TradeItem) => void
}) {
  const { t } = useTranslation()
  const isEdit = Boolean(initial)

  const [title, setTitle] = useState('')
  const [categoryMode, setCategoryMode] = useState<'select' | 'custom'>('select')
  const [category, setCategory] = useState('Otomobil')
  const [customCategory, setCustomCategory] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(toIsoDateInputValue(new Date()))
  const [purchasePrice, setPurchasePrice] = useState<number>(0)
  const [sold, setSold] = useState(false)
  const [saleDate, setSaleDate] = useState(toIsoDateInputValue(new Date()))
  const [salePrice, setSalePrice] = useState<number>(0)

  useEffect(() => {
    if (!open) return
    if (!initial) {
      setTitle('')
      setCategoryMode('select')
      setCategory('Otomobil')
      setCustomCategory('')
      setPurchaseDate(toIsoDateInputValue(new Date()))
      setPurchasePrice(0)
      setSold(false)
      setSaleDate(toIsoDateInputValue(new Date()))
      setSalePrice(0)
      return
    }

    setTitle(initial.title)
    const hasCategoryInList = categories.includes(initial.category)
    setCategoryMode(hasCategoryInList ? 'select' : 'custom')
    setCategory(hasCategoryInList ? initial.category : 'Otomobil')
    setCustomCategory(hasCategoryInList ? '' : initial.category)
    setPurchaseDate(initial.purchaseDate)
    setPurchasePrice(initial.purchasePrice)
    setSold(Boolean(initial.saleDate && initial.salePrice != null))
    setSaleDate(initial.saleDate ?? toIsoDateInputValue(new Date()))
    setSalePrice(initial.salePrice ?? 0)
  }, [open, initial, categories])

  const resolvedCategory = useMemo(() => {
    const v = categoryMode === 'custom' ? customCategory : category
    return v.trim() || 'Diğer'
  }, [categoryMode, customCategory, category])

  const canSubmit = title.trim().length > 0 && purchaseDate.trim().length > 0 && Number.isFinite(purchasePrice)

  return (
    <Modal
      title={isEdit ? t('tradeForm.editTitle') : t('tradeForm.createTitle')}
      open={open}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('tradeForm.cancel')}
          </Button>
          <Button
            onClick={() => {
              const item: TradeItem = {
                id: initial?.id ?? newId(),
                title: title.trim(),
                category: resolvedCategory,
                purchaseDate,
                purchasePrice: Number(purchasePrice),
                saleDate: sold ? saleDate : null,
                salePrice: sold ? Number(salePrice) : null,
              }
              onSubmit(item)
              onClose()
            }}
            disabled={!canSubmit}
          >
            {t('tradeForm.save')}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <div>
          <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.title')}</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('tradeForm.fields.titlePlaceholder')}
            className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-slate-900/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.category')}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategoryMode('select')}
                className={[
                  'rounded-2xl border px-3 py-2 text-sm font-medium',
                  categoryMode === 'select'
                    ? 'border-slate-900/20 bg-black/5 text-slate-900'
                    : 'border-[var(--tf-border)] bg-white/60 text-slate-700 hover:bg-black/5',
                ].join(' ')}
              >
                {t('tradeForm.fields.categorySelect')}
              </button>
              <button
                type="button"
                onClick={() => setCategoryMode('custom')}
                className={[
                  'rounded-2xl border px-3 py-2 text-sm font-medium',
                  categoryMode === 'custom'
                    ? 'border-slate-900/20 bg-black/5 text-slate-900'
                    : 'border-[var(--tf-border)] bg-white/60 text-slate-700 hover:bg-black/5',
                ].join(' ')}
              >
                {t('tradeForm.fields.categoryCustom')}
              </button>
            </div>

            {categoryMode === 'select' ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder={t('tradeForm.fields.categoryPlaceholder')}
                className="mt-3 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
              />
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.purchaseDate')}</div>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.purchasePrice')}</div>
            <input
              type="number"
              value={Number.isFinite(purchasePrice) ? purchasePrice : 0}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--tf-border)] bg-white/60 px-4 py-3 text-sm text-slate-800">
              <input type="checkbox" checked={sold} onChange={(e) => setSold(e.target.checked)} />
              {t('tradeForm.fields.sold')}
            </label>
          </div>
        </div>

        {sold ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.saleDate')}</div>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-600">{t('tradeForm.fields.salePrice')}</div>
              <input
                type="number"
                value={Number.isFinite(salePrice) ? salePrice : 0}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

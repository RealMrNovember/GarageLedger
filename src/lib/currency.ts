export type CurrencyCode = 'AZN' | 'USD' | 'EUR' | 'TRY'
export type FxUpdateMode = 'manual' | '15m' | '30m' | '1h'

export type FxRates = {
  base: 'AZN'
  fetchedAt: string
  rates: Partial<Record<CurrencyCode, number>>
}

export const FX_STORAGE_KEY = 'garageledger.fxRates.v1'
export const FX_UPDATED_EVENT = 'garageledger-fx-updated'

export function currencySymbol(code: CurrencyCode): string {
  switch (code) {
    case 'AZN':
      return '₼'
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    case 'TRY':
      return '₺'
    default:
      return '₼'
  }
}

export function readFxRates(): FxRates | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(FX_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FxRates
    if (!parsed || parsed.base !== 'AZN' || typeof parsed.fetchedAt !== 'string' || typeof parsed.rates !== 'object') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeFxToStorage(data: FxRates) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(data))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FX_UPDATED_EVENT, { detail: data }))
    }
  } catch {
    return
  }
}

export function fxModeToMs(mode: FxUpdateMode): number | null {
  switch (mode) {
    case '15m':
      return 15 * 60 * 1000
    case '30m':
      return 30 * 60 * 1000
    case '1h':
      return 60 * 60 * 1000
    default:
      return null
  }
}

export function isFxStale(fetchedAt: string | null | undefined, mode: FxUpdateMode): boolean {
  if (!fetchedAt || mode === 'manual') return false
  const ms = fxModeToMs(mode)
  if (!ms) return false
  const at = Date.parse(fetchedAt)
  if (Number.isNaN(at)) return true
  return Date.now() - at >= ms
}

export function formatFxDisplayTime(iso: string | null | undefined, locale?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function convertFromAzn(value: number, to: CurrencyCode, fx?: FxRates | null): number {
  if (!Number.isFinite(value)) return 0
  if (to === 'AZN') return value
  const src = fx ?? readFxRates()
  const rate = src?.rates?.[to]
  if (!rate || !Number.isFinite(rate) || rate <= 0) return value
  return value * rate
}

export function formatMoney(value: number, code: CurrencyCode, fx?: FxRates | null): string {
  const symbol = currencySymbol(code)
  const converted = convertFromAzn(value, code, fx)
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted)
  return `${symbol}${formatted}`
}

export async function refreshFxRates(opts?: {
  force?: boolean
  mode?: FxUpdateMode
}): Promise<FxRates | null> {
  const cached = readFxRates()
  const mode = opts?.mode ?? '30m'
  const force = Boolean(opts?.force)

  if (!force) {
    if (mode === 'manual') return cached
    const lastAt = cached?.fetchedAt ? Date.parse(cached.fetchedAt) : 0
    const interval = fxModeToMs(mode)
    if (lastAt && interval && Date.now() - lastAt < interval) return cached
  }

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/AZN', {
      signal: ctrl.signal,
      headers: { 'Cache-Control': 'no-cache' },
    })
    clearTimeout(timer)
    if (!res.ok) return cached
    const json = (await res.json()) as { base?: string; rates?: Record<string, number> }
    const rates = json?.rates ?? {}

    const next: FxRates = {
      base: 'AZN',
      fetchedAt: new Date().toISOString(),
      rates: {
        AZN: 1,
        USD: Number(rates.USD),
        EUR: Number(rates.EUR),
        TRY: Number(rates.TRY),
      },
    }
    writeFxToStorage(next)
    return next
  } catch {
    return cached
  }
}

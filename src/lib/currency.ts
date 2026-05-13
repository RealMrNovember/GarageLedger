export type CurrencyCode = 'AZN' | 'USD' | 'EUR' | 'TRY'

export type FxRates = {
  base: 'AZN'
  fetchedAt: string
  rates: Partial<Record<CurrencyCode, number>>
}

const FX_STORAGE_KEY = 'garageledger.fxRates.v1'

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

function readFxFromStorage(): FxRates | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(FX_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FxRates
    if (!parsed || parsed.base !== 'AZN' || typeof parsed.fetchedAt !== 'string' || typeof parsed.rates !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeFxToStorage(data: FxRates) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(data))
  } catch {
    return
  }
}

export function convertFromAzn(value: number, to: CurrencyCode, fx?: FxRates | null): number {
  if (!Number.isFinite(value)) return 0
  if (to === 'AZN') return value
  const src = fx ?? readFxFromStorage()
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

export async function refreshFxRates(): Promise<FxRates | null> {
  const cached = readFxFromStorage()
  const lastAt = cached?.fetchedAt ? Date.parse(cached.fetchedAt) : 0
  const now = Date.now()
  const isFresh = lastAt && now - lastAt < 6 * 60 * 60 * 1000
  if (isFresh) return cached

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


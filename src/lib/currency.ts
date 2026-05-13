export type CurrencyCode = 'AZN' | 'USD' | 'EUR'

export function currencySymbol(code: CurrencyCode): string {
  switch (code) {
    case 'AZN':
      return '₼'
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    default:
      return '₼'
  }
}

export function formatMoney(value: number, code: CurrencyCode): string {
  const symbol = currencySymbol(code)
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
  return `${symbol}${formatted}`
}


export const formatCurrency = (
  value: number | bigint | Intl.StringNumericLiteral,
  currency: string = 'EUR',
  locales: Intl.LocalesArgument = 'es'
) =>
  Intl.NumberFormat(locales, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

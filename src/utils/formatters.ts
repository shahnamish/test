export const formatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);

export const formatPercent = (value: number) =>
  `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

export const formatOdds = (odds: number) => `${odds.toFixed(2)}x`;

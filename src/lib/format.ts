export function formatWeek(weekStart: string): string {
  const date = new Date(`${weekStart}T00:00:00`)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatGhs(amount: number): string {
  return Math.round(amount).toLocaleString('en-GB')
}

export function formatProfitLine(profit: number | null | undefined): string {
  if (profit == null) return '—'
  const prefix = profit >= 0 ? '+' : ''
  return `${prefix}GHS ${formatGhs(profit)}`
}

export function revenueTrendIcon(trend: 'up' | 'down' | 'same' | null | undefined): string {
  if (trend === 'up') return '📈'
  if (trend === 'down') return '📉'
  return '📊'
}

export function revenueVsLastWeek(
  currentRevenue: number,
  previousRevenue: number | undefined,
): 'up' | 'down' | 'same' | null {
  if (previousRevenue == null) return null
  if (currentRevenue > previousRevenue) return 'up'
  if (currentRevenue < previousRevenue) return 'down'
  return 'same'
}

import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { productBadge } from '#/components/DashboardView'
import { reportsApi } from '#/lib/api'
import { formatGhs, formatWeek } from '#/lib/format'
import type { ReportJson } from '#/lib/types'

export const Route = createFileRoute('/report/print')({
  validateSearch: (search: Record<string, unknown>) => ({
    weekStart: typeof search.weekStart === 'string' ? search.weekStart : undefined,
  }),
  component: PrintReportPage,
})

function PrintReportPage() {
  const { weekStart } = Route.useSearch()
  const [report, setReport] = useState<ReportJson | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = weekStart
      ? reportsApi.byWeek(weekStart).then((r) => r.report)
      : reportsApi.latest().then((r) => r.report)
    load.then(setReport).catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [weekStart])

  if (error) {
    return (
      <main className="page">
        <div className="flash-error">{error}</div>
      </main>
    )
  }

  if (!report) {
    return (
      <main className="page text-center">
        <div className="spinner my-10" />
      </main>
    )
  }

  const v = report.visual ?? {}
  const t = report.text ?? {}
  const revenue = v.revenue_ghs ?? report.revenue
  const cost = v.cost_ghs ?? report.cost
  const profit = v.profit_ghs ?? report.profit
  const products = [...report.products].sort((a, b) => b.revenue - a.revenue)

  return (
    <main className="page" style={{ maxWidth: 700 }}>
      <div className="mb-4 rounded-xl border border-[#86efac] bg-[#f0fdf4] p-3 text-sm text-[#166534] print:hidden">
        <div className="flex items-center justify-between gap-3">
          <span>📄 Share → Print → Save as PDF</span>
          <button type="button" className="btn-primary !min-h-0 px-4 py-2 text-sm" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
      </div>

      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Business Report</h1>
      <p className="mb-5 text-xs text-[var(--warm-gray)]">
        Week of {formatWeek(report.weekStart)} · Generated {new Date().toLocaleDateString('en-GB')}
      </p>

      <div className="hero-grid">
        <div className="hero-box">
          <div className="hero-label">Money Made (Revenue)</div>
          <div className="hero-value">GHS {formatGhs(revenue)}</div>
        </div>
        <div className="hero-box">
          <div className="hero-label">Money Spent (Cost)</div>
          <div className="hero-value">GHS {formatGhs(cost)}</div>
        </div>
        <div className="hero-box">
          <div className="hero-label">Money Kept (Profit)</div>
          <div className="hero-value" style={{ color: (profit ?? 0) >= 0 ? 'var(--green-mid)' : 'var(--red)' }}>
            {profit != null ? `GHS ${formatGhs(profit)}` : '—'}
          </div>
        </div>
      </div>

      {products.length > 0 && (
        <div className="card">
          <div className="card-label">Products this week</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[var(--border)] text-left text-xs uppercase text-[var(--warm-gray)]">
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Sold</th>
                <th className="py-2 text-right">Revenue</th>
                <th className="py-2 text-right">Kept per item</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const badge = productBadge(p)
                return (
                <tr key={p.name} className="border-b border-[var(--border)]">
                  <td className="py-2 font-semibold">{p.name}</td>
                  <td className="py-2 text-right">{p.unitsSold ?? '—'}</td>
                  <td className="py-2 text-right text-[var(--green-mid)]">GHS {p.revenue.toFixed(2)}</td>
                  <td className="py-2 text-right">{badge.text}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {(t.what_this_means || t.what_is_working || t.recommendation || t.critical_alerts) && (
        <>
          <div className="section-head">Your Advisor This Week</div>
          {t.critical_alerts && (
            <div className="advisor-section advisor-section-critical">
              <div className="advisor-section-label">Important</div>
              <div className="advisor-section-text">{t.critical_alerts}</div>
            </div>
          )}
          {t.what_this_means && (
            <div className="advisor-section">
              <div className="advisor-section-label">What happened</div>
              <div className="advisor-section-text">{t.what_this_means}</div>
            </div>
          )}
          {t.what_is_working && (
            <div className="advisor-section">
              <div className="advisor-section-label">What is working</div>
              <div className="advisor-section-text">{t.what_is_working}</div>
            </div>
          )}
          {t.recommendation && (
            <div className="advisor-section advisor-section-action">
              <div className="advisor-section-label">What to do next</div>
              <div className="advisor-section-text">{t.recommendation}</div>
            </div>
          )}
        </>
      )}
    </main>
  )
}

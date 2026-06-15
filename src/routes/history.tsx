import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { reportsApi } from '#/lib/api'
import {
  formatGhs,
  formatProfitLine,
  formatWeek,
  revenueTrendIcon,
  revenueVsLastWeek,
} from '#/lib/format'
import type { WeekSummary } from '#/lib/types'

export const Route = createFileRoute('/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const [weeks, setWeeks] = useState<WeekSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingWeek, setDeletingWeek] = useState<string | null>(null)

  useEffect(() => {
    reportsApi
      .history()
      .then((res) => setWeeks(res.weeks))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load history'))
      .finally(() => setLoading(false))
  }, [])

  async function onDelete(weekStart: string) {
    const label = formatWeek(weekStart)
    if (
      !window.confirm(
        `Delete the report for ${label}?\n\nYou can upload new records for this week anytime.`,
      )
    ) {
      return
    }

    setDeletingWeek(weekStart)
    setError('')
    try {
      await reportsApi.delete(weekStart)
      setWeeks((current) => current.filter((week) => week.weekStart !== weekStart))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report')
    } finally {
      setDeletingWeek(null)
    }
  }

  return (
    <main className="page">
      <div className="card">
        <div className="card-label">Past Weeks</div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">My History</h1>
      </div>

      {error && <div className="flash-error">{error}</div>}

      {loading && (
        <div className="card text-center">
          <div className="spinner my-6" />
        </div>
      )}

      {!loading && weeks.length === 0 && !error && (
        <div className="card text-center">
          <div className="text-4xl">📭</div>
          <p className="mt-3 text-sm text-[var(--warm-gray)]">
            No past reports yet. Upload your records to get started.
          </p>
          <Link
            to="/upload"
            search={{ weekStart: undefined }}
            className="btn-primary mt-4"
          >
            <span aria-hidden>📸</span>
            <span>Upload Records</span>
          </Link>
        </div>
      )}

      {!loading && weeks.length > 0 && (
        <>
          <div className="card">
            <div className="card-label">All Weeks</div>
            {weeks.map((week) => (
              <Link
                key={week.weekStart}
                to="/report/$weekStart"
                params={{ weekStart: week.weekStart }}
                className="history-row"
              >
                <div className="min-w-0">
                  <div className="font-semibold">{formatWeek(week.weekStart)}</div>
                  <div className="text-xs text-[var(--warm-gray)]">
                    {week.days != null ? `${week.days} days` : '—'}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">GHS {formatGhs(week.revenue)}</div>
                  <div
                    className="text-xs"
                    style={{
                      color:
                        week.profit == null
                          ? 'var(--warm-gray)'
                          : week.profit >= 0
                            ? 'var(--green-mid)'
                            : 'var(--red)',
                    }}
                  >
                    {formatProfitLine(week.profit)}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="card-label">Report Details</div>
          {weeks.map((week, index) => {
            const previousWeek = weeks[index + 1]
            const trend = revenueVsLastWeek(week.revenue, previousWeek?.revenue)
            const isDeleting = deletingWeek === week.weekStart

            return (
              <div key={week.weekStart} className="card">
                <div className="mb-3 font-semibold">{formatWeek(week.weekStart)}</div>
                <div className="hero-grid">
                  <div className="hero-box">
                    <div className="hero-label">Revenue</div>
                    <div className="hero-value">GHS {formatGhs(week.revenue)}</div>
                  </div>
                  <div className="hero-box">
                    <div className="hero-label">Profit</div>
                    <div
                      className="hero-value"
                      style={{
                        color:
                          week.profit == null
                            ? 'var(--warm-gray)'
                            : week.profit >= 0
                              ? 'var(--green-mid)'
                              : 'var(--red)',
                      }}
                    >
                      {week.profit == null ? '—' : `GHS ${formatGhs(week.profit)}`}
                    </div>
                  </div>
                  <div className="hero-box">
                    <div className="hero-label">Trend</div>
                    <div className="hero-value text-2xl">{revenueTrendIcon(trend)}</div>
                  </div>
                </div>
                <Link
                  to="/data/$weekStart"
                  params={{ weekStart: week.weekStart }}
                  className="mt-3 inline-block text-sm font-semibold text-[var(--green-deep)]"
                >
                  🔍 Check the data we read
                </Link>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    to="/upload"
                    search={{ weekStart: week.weekStart }}
                    className="btn-secondary text-sm"
                  >
                    <span aria-hidden>📸</span>
                    <span>Re-upload</span>
                  </Link>
                  <button
                    type="button"
                    className="btn-danger text-sm"
                    disabled={isDeleting}
                    onClick={() => onDelete(week.weekStart)}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete week'}
                  </button>
                </div>
              </div>
            )
          })}
        </>
      )}
    </main>
  )
}

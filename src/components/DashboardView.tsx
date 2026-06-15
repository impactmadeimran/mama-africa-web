import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import DashboardCharts from '#/components/DashboardCharts'
import { formatGhs, formatWeek } from '#/lib/format'
import type { DashboardPayload } from '#/lib/types'

function profitBoxClass(profit: number | null | undefined) {
  if (profit == null) return 'profit-amber'
  if (profit > 0) return 'profit-green'
  if (profit < 0) return 'profit-red'
  return 'profit-amber'
}

function streakMessage(streak: number) {
  if (streak === 1) return 'First week recorded!'
  if (streak === 2) return '2 weeks in a row — good habit!'
  return `${streak} weeks in a row — keep it up!`
}

function productBadge(p: { revenue: number; cost: number; margin: number; unitsSold?: number }) {
  const profitPerUnit =
    p.unitsSold && p.unitsSold > 0 ? (p.revenue - p.cost) / p.unitsSold : null
  if (profitPerUnit != null && profitPerUnit < 0) return { cls: 'badge-loss', text: 'losing money' }
  if (profitPerUnit != null && profitPerUnit > 0) {
    return { cls: 'badge-good', text: `GHS ${profitPerUnit.toFixed(2)}/item kept` }
  }
  return { cls: 'badge-none', text: `${Math.round(p.margin)}% of sales` }
}

type Props = {
  data: DashboardPayload
  showRecentWeeks?: boolean
  backLink?: { to: '/history'; label: string }
}

export default function DashboardView({ data, showRecentWeeks = true, backLink }: Props) {
  const [chartsOpen, setChartsOpen] = useState(false)
  const report = data.report!
  const v = report.visual ?? {}
  const t = report.text ?? {}
  const revenue = v.revenue_ghs ?? report.revenue
  const cost = v.cost_ghs ?? report.cost
  const profit = v.profit_ghs ?? report.profit
  const sortedProducts = [...report.products].sort((a, b) => b.revenue - a.revenue)

  return (
    <>
      {backLink && (
        <Link to={backLink.to} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--green-deep)]">
          <span aria-hidden>←</span>
          {backLink.label}
        </Link>
      )}

      {data.headline && (
        <div className={`headline-card hc-${data.headline.color}`}>
          <span className="text-2xl">{data.headline.color === 'green' ? '✨' : '💡'}</span>
          <span>{data.headline.text}</span>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <span className="week-badge">{formatWeek(report.weekStart)}</span>
        {v.revenue_trend_icon && v.revenue_change_pct != null && (
          <span
            className="rounded-full px-2.5 py-1 text-xs font-bold"
            style={{
              background: v.revenue_vs_last_week === 'up' ? '#f0fdf4' : '#fef2f2',
              color: v.revenue_vs_last_week === 'up' ? 'var(--green-mid)' : 'var(--red)',
            }}
          >
            {v.revenue_trend_icon} {v.revenue_change_pct}% vs last week
          </span>
        )}
      </div>

      <div className="hero-grid">
        <div className="hero-box">
          <div className="hero-label">💰 Money Made (Revenue)</div>
          <div className="hero-value text-[var(--green-mid)]">{formatGhs(revenue)}</div>
          <div className="text-[0.6rem] text-[var(--warm-gray)]">GHS</div>
        </div>
        <div className="hero-box">
          <div className="hero-label">🛒 Money Spent (Cost)</div>
          <div className="hero-value text-[var(--amber)]">{formatGhs(cost)}</div>
          <div className="text-[0.6rem] text-[var(--warm-gray)]">GHS</div>
        </div>
        <div className={`hero-box ${profitBoxClass(profit)}`}>
          <div className="hero-label">✨ Money Kept (Profit)</div>
          {profit != null ? (
            <>
              <div
                className="hero-value"
                style={{ color: profit >= 0 ? 'var(--green-mid)' : 'var(--red)' }}
              >
                {formatGhs(profit)}
              </div>
              <div className="text-[0.6rem] text-[var(--warm-gray)]">GHS</div>
            </>
          ) : (
            <div className="pt-1 text-sm leading-snug text-[var(--warm-gray)]">
              End of
              <br />
              month
            </div>
          )}
        </div>
      </div>

      {data.action && (
        <div className="action-card">
          <span className="text-2xl">{data.action.icon}</span>
          <div>
            <div className="text-[0.65rem] font-bold uppercase tracking-wide opacity-65">
              Do this this week
            </div>
            <div className="text-[0.95rem] font-semibold leading-snug">{data.action.text}</div>
          </div>
        </div>
      )}

      {data.streak > 0 && (
        <div className="streak-row">
          <span>🔥</span>
          <span>{streakMessage(data.streak)}</span>
          <div className="streak-dots">
            {Array.from({ length: Math.min(data.streak, 6) }).map((_, i) => (
              <div key={i} className="streak-dot" />
            ))}
            {Array.from({ length: Math.max(6 - data.streak, 0) }).map((_, i) => (
              <div key={`e-${i}`} className="streak-dot empty" />
            ))}
          </div>
        </div>
      )}

      {v.concentration_alert && (
        <div className="alert-badge alert-warning">
          <span>⚠️</span>
          <div>
            You depend a lot on <strong>{String(v.concentration_alert)}</strong>. Try building up
            other products too.
          </div>
        </div>
      )}

      {v.total_receivables_ghs != null && v.total_receivables_ghs > 0 && (
        <>
          <div className="section-head" id="receivables">
            💳 Money People Owe You
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--warm-gray)]">Total outstanding</span>
              <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--amber)]">
                GHS {formatGhs(v.total_receivables_ghs)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--warm-gray)]">
              Follow up with customers who bought on credit this week.
            </p>
          </div>
        </>
      )}

      {v.projection?.projected_monthly_profit_ghs != null && (
        <div className="projection-box">
          <div className="text-[0.67rem] font-bold uppercase tracking-wide opacity-65">
            📈 If you keep going this month...
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="font-[family-name:var(--font-display)] text-2xl font-bold">
                GHS {formatGhs(v.projection.projected_monthly_revenue_ghs ?? 0)}
              </div>
              <div className="text-xs opacity-65">Total money made (revenue)</div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-2xl font-bold">
                GHS {formatGhs(v.projection.projected_monthly_profit_ghs ?? 0)}
              </div>
              <div className="text-xs opacity-65">Money you keep (profit)</div>
            </div>
          </div>
        </div>
      )}

      {sortedProducts.length > 0 && (
        <div className="card">
          <div className="card-label">Products this week</div>
          <p className="product-list-hint">Ranked best to worst by sales</p>
          <ul className="product-list">
            {sortedProducts.map((p) => {
              if (!(p.unitsSold ?? 0)) return null
              const badge = productBadge(p)
              return (
                <li key={p.name} className="product-item">
                  <div className="product-name">{p.name}</div>
                  <div className="product-meta">
                    <span className="product-units">{p.unitsSold} sold</span>
                    <span className="product-rev">
                      GHS {formatGhs(p.revenue)}
                      <span className="product-rev-hint">revenue</span>
                    </span>
                  </div>
                  <span className={`product-badge ${badge.cls}`}>{badge.text}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="insight-grid">
        {v.concentration_alert && (
          <div className="insight-card ic-amber">
            <div className="ic-label">💡 Growth opportunity</div>
            <div className="ic-value text-[0.95rem]">{String(v.concentration_alert)}</div>
            <div className="ic-sub">Your strongest product</div>
          </div>
        )}
        {v.best_day && (
          <div className="insight-card ic-blue">
            <div className="ic-label">⭐ Best Day</div>
            <div className="ic-value">{v.best_day.day}</div>
            <div className="ic-sub">GHS {formatGhs(v.best_day.revenue_ghs ?? 0)} in sales</div>
          </div>
        )}
        {v.total_receivables_ghs != null && v.total_receivables_ghs > 0 && (
          <div className="insight-card ic-amber">
            <div className="ic-label">💳 Credit sales</div>
            <div className="ic-value">GHS {formatGhs(v.total_receivables_ghs)}</div>
            <div className="ic-sub">
              <a href="#receivables" className="font-bold text-inherit">
                See details →
              </a>
            </div>
          </div>
        )}
      </div>

      {(t.what_this_means ||
        t.what_is_working ||
        t.critical_alerts ||
        t.areas_to_watch ||
        t.recommendation ||
        t.pricing_notes ||
        report.report.costNote) && (
        <>
          <div className="section-head">🧑‍💼 Your Advisor</div>
          {report.report.costNote && (
            <div className="advisor-section" style={{ borderLeftColor: '#6366f1', background: '#f5f3ff' }}>
              <div className="advisor-section-label" style={{ color: '#4338ca' }}>
                ℹ️ About this week&apos;s costs
              </div>
              <div className="advisor-section-text">{report.report.costNote}</div>
            </div>
          )}
          {(t.what_this_means || report.report.whatThisMeans) && (
            <div className="advisor-section">
              <div className="advisor-section-label">📊 What happened this week</div>
              <div className="advisor-section-text">
                {t.what_this_means || report.report.whatThisMeans}
              </div>
            </div>
          )}
          {(t.what_is_working || report.report.whatIsWorking) && (
            <div className="advisor-section">
              <div className="advisor-section-label">✅ What is working</div>
              <div className="advisor-section-text">
                {t.what_is_working || report.report.whatIsWorking}
              </div>
            </div>
          )}
          {(t.critical_alerts || report.report.criticalAlerts)?.trim() && (
            <div className="advisor-section advisor-section-critical">
              <div className="advisor-section-label">🚨 Important — needs your attention</div>
              <div className="advisor-section-text">
                {t.critical_alerts || report.report.criticalAlerts}
              </div>
            </div>
          )}
          {(t.areas_to_watch || report.report.areasToWatch) &&
            (t.areas_to_watch || report.report.areasToWatch) !== 'Nothing to flag this week.' && (
              <div
                className={`advisor-section ${
                  /going well|growth|ready/i.test(t.areas_to_watch || '')
                    ? 'advisor-section-growth'
                    : 'advisor-section-watch'
                }`}
              >
                <div className="advisor-section-label">
                  {/going well|growth|ready/i.test(t.areas_to_watch || '')
                    ? '🌱 Looking ahead'
                    : '👀 Areas to watch'}
                </div>
                <div className="advisor-section-text">
                  {t.areas_to_watch || report.report.areasToWatch}
                </div>
              </div>
            )}
          {(t.recommendation || report.report.recommendation) && (
            <div className="advisor-section advisor-section-action">
              <div className="advisor-section-label">👉 What to do next</div>
              <div className="advisor-section-text">
                {t.recommendation || report.report.recommendation}
              </div>
            </div>
          )}
          {(t.pricing_notes || report.report.pricingNotes) && (
            <div className="advisor-section">
              <div className="advisor-section-label">💰 Pricing notes</div>
              <div className="advisor-section-text">
                {t.pricing_notes || report.report.pricingNotes}
              </div>
            </div>
          )}
        </>
      )}

      <Link
        to="/report/print"
        search={{ weekStart: report.weekStart }}
        className="btn-secondary mb-3 text-sm"
      >
        <span aria-hidden>📄</span>
        <span>Download or share this report</span>
      </Link>

      {(data.chartWeeks.length >= 2 || report.products.length > 0) && (
        <>
          <button type="button" className="charts-toggle" onClick={() => setChartsOpen((o) => !o)}>
            <span>
              <span aria-hidden>📊</span>
              <span>{chartsOpen ? 'Hide charts' : 'See charts'}</span>
            </span>
            <span aria-hidden>{chartsOpen ? '▲' : '▼'}</span>
          </button>
          {chartsOpen && (
            <DashboardCharts
              chartWeeks={data.chartWeeks}
              chartRevenue={data.chartRevenue}
              chartProfit={data.chartProfit}
              products={report.products}
            />
          )}
        </>
      )}

      {showRecentWeeks && data.history.length > 0 && (
        <>
          <div className="section-head">📅 Recent Weeks</div>
          <div className="card">
            {data.history.map((h) => (
              <Link
                key={h.weekStart}
                to="/report/$weekStart"
                params={{ weekStart: h.weekStart }}
                className="history-row"
              >
                <div>
                  <div className="text-xs font-semibold text-[var(--warm-gray)]">
                    {formatWeek(h.weekStart)}
                  </div>
                  <div className="font-[family-name:var(--font-display)] text-lg font-bold">
                    GHS {formatGhs(h.revenue)}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-sm font-semibold"
                    style={{ color: h.profit >= 0 ? 'var(--green-mid)' : 'var(--red)' }}
                  >
                    Profit GHS {formatGhs(h.profit)}
                  </div>
                </div>
              </Link>
            ))}
            <Link
              to="/history"
              className="block py-3 text-center text-sm font-bold text-[var(--green-deep)]"
            >
              See all weeks →
            </Link>
          </div>
        </>
      )}
    </>
  )
}

export { profitBoxClass, productBadge, streakMessage }

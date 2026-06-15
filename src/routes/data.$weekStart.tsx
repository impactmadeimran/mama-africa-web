import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { reportsApi } from '#/lib/api'
import { formatWeek } from '#/lib/format'
import type { OcrResult } from '#/lib/types'

export const Route = createFileRoute('/data/$weekStart')({
  component: DataPage,
})

function DataPage() {
  const { weekStart } = Route.useParams()
  const [ocr, setOcr] = useState<OcrResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportsApi
      .ocrByWeek(weekStart)
      .then((res) => setOcr(res.ocr))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [weekStart])

  if (loading) {
    return (
      <main className="page text-center">
        <div className="spinner my-10" />
      </main>
    )
  }

  if (error || !ocr) {
    return (
      <main className="page">
        <div className="flash-error">{error || 'No data found for this week'}</div>
        <Link to="/history" className="btn-secondary mt-3 text-center">
          Back to history
        </Link>
      </main>
    )
  }

  return (
    <main className="page">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--green-deep)]">
        Your Records
      </h1>
      <div className="week-badge mt-2">{formatWeek(weekStart)}</div>

      <div className="alert-badge alert-info mt-4">
        <span>ℹ️</span>
        <div>
          This is the data we read from your photos. Check that the numbers match your record
          book. If something looks wrong, upload the photos again with a flatter, clearer image.
        </div>
      </div>

      {(ocr.sales ?? []).map((day, dayIdx) =>
        (day.entries ?? []).length ? (
          <div key={dayIdx}>
            <div className="section-head">💰 Sales · {day.date ?? 'Unknown date'}</div>
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[320px] text-sm">
                <thead>
                  <tr className="border-b-2 border-[var(--border)] text-left text-xs uppercase text-[var(--warm-gray)]">
                    <th className="py-2">Product</th>
                    <th className="py-2 text-right">Units</th>
                    <th className="py-2 text-right">Price each</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(day.entries ?? []).map((entry, entryIdx) => {
                    const total =
                      entry.price_per_unit_ghs != null && entry.tally_count
                        ? entry.price_per_unit_ghs * entry.tally_count
                        : null
                    return (
                      <tr key={entryIdx} className="border-b border-[var(--border)]">
                        <td className="py-2 font-semibold">
                          {entry.product_raw ?? '?'}
                          {entry.uncertain_fields?.length ? (
                            <span className="ml-1 text-xs text-[var(--amber)]">⚠️ uncertain</span>
                          ) : null}
                        </td>
                        <td className="py-2 text-right text-[var(--warm-gray)]">
                          {entry.tally_count ?? '?'}
                        </td>
                        <td className="py-2 text-right text-[var(--warm-gray)]">
                          {entry.price_per_unit_ghs != null
                            ? `GHS ${entry.price_per_unit_ghs.toFixed(3)}`
                            : '?'}
                        </td>
                        <td className="py-2 text-right font-bold text-[var(--green-mid)]">
                          {total != null ? `GHS ${total.toFixed(2)}` : '?'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null,
      )}

      {(ocr.costs ?? []).some((c) => (c.entries ?? []).length > 0) && (
        <>
          <div className="section-head">🛒 Costs We Read</div>
          <div className="card overflow-x-auto">
            {ocr.cost_period && (
              <div className="card-label mb-2">Cost period: {ocr.cost_period}</div>
            )}
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--border)] text-left text-xs uppercase text-[var(--warm-gray)]">
                  <th className="py-2">Product</th>
                  <th className="py-2 text-right">Pack size</th>
                  <th className="py-2 text-right">Price/pack</th>
                  <th className="py-2 text-right">Packs</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(ocr.costs ?? []).flatMap((period, pi) =>
                  (period.entries ?? []).map((entry, ei) => {
                    const total =
                      entry.price_per_pack_ghs != null && entry.packs_bought
                        ? entry.price_per_pack_ghs * entry.packs_bought
                        : null
                    return (
                      <tr key={`${pi}-${ei}`} className="border-b border-[var(--border)]">
                        <td className="py-2 font-semibold">
                          {entry.product_raw ?? '?'}
                          {entry.uncertain_fields?.length ? (
                            <span className="ml-1 text-xs text-[var(--amber)]">⚠️</span>
                          ) : null}
                        </td>
                        <td className="py-2 text-right">{entry.pack_size ?? '?'}</td>
                        <td className="py-2 text-right">
                          {entry.price_per_pack_ghs != null
                            ? `GHS ${entry.price_per_pack_ghs.toFixed(3)}`
                            : '?'}
                        </td>
                        <td className="py-2 text-right">{entry.packs_bought ?? '?'}</td>
                        <td className="py-2 text-right font-bold text-[var(--amber)]">
                          {total != null ? `GHS ${total.toFixed(2)}` : '?'}
                        </td>
                      </tr>
                    )
                  }),
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {ocr.uncertainties && ocr.uncertainties.length > 0 && (
        <>
          <div className="section-head">⚠️ Things We Were Not Sure About</div>
          <div className="card bg-[#fffbeb]" style={{ borderColor: '#fcd34d' }}>
            {ocr.uncertainties.map((u, i) => (
              <div key={i} className="border-b border-[var(--border)] py-2 text-sm last:border-0">
                {u}
              </div>
            ))}
          </div>
        </>
      )}

      {ocr.notes?.trim() && (
        <div className="card bg-[#f8f8f6]">
          <div className="card-label">Notes from reading</div>
          <p className="text-sm leading-relaxed text-[var(--warm-gray)]">{ocr.notes}</p>
        </div>
      )}

      {(ocr.ingredients ?? []).length > 0 && (
        <>
          <div className="section-head">🥘 Ingredients</div>
          <div className="card">
            {(ocr.ingredients ?? []).map((ing, i) => (
              <div key={i} className="border-b border-[var(--border)] py-2 text-sm last:border-0">
                <strong>{ing.ingredient ?? '?'}</strong>
                <span className="ml-2 text-[var(--warm-gray)]">
                  {ing.amount_ghs != null ? `GHS ${ing.amount_ghs.toFixed(2)}` : '?'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {(ocr.leftovers ?? []).length > 0 && (
        <>
          <div className="section-head text-[var(--green-mid)]">✅ Leftovers</div>
          <div className="card" style={{ borderColor: 'var(--green-light)' }}>
            {(ocr.leftovers ?? []).map((l, i) => (
              <div key={i} className="border-b border-[var(--border)] py-2 text-sm last:border-0">
                <strong>{l.ingredient ?? '?'}</strong>
                <span className="ml-2 text-[var(--green-mid)]">
                  {l.value_ghs != null ? `GHS ${l.value_ghs.toFixed(2)}` : '?'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {(ocr.spoilage ?? []).length > 0 && (
        <>
          <div className="section-head text-[var(--red)]">⚠️ Spoilage</div>
          <div className="card" style={{ borderColor: '#fca5a5' }}>
            {(ocr.spoilage ?? []).map((s, i) => (
              <div key={i} className="border-b border-[var(--border)] py-2 text-sm last:border-0">
                <strong>{s.ingredient ?? '?'}</strong>
                <span className="ml-2 text-[var(--red)]">
                  {s.value_ghs != null ? `GHS ${s.value_ghs.toFixed(2)}` : '?'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <Link to="/history" className="btn-secondary mt-4">
        <span aria-hidden>←</span>
        <span>Back to history</span>
      </Link>
    </main>
  )
}

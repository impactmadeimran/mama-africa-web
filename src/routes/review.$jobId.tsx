import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { jobsApi } from '#/lib/api'
import { buildOcrDisplay } from '#/lib/ocr-display'
import type { OcrResult } from '#/lib/types'

function isPriceLabel(name: string) {
  return ['p', 'p:', 'p.', 'p-'].includes(name.trim().toLowerCase())
}

function hasEditableSalesEntries(ocr: OcrResult) {
  return (ocr.sales ?? []).some((day) =>
    (day.entries ?? []).some((e) => !isPriceLabel(e.product_raw ?? '')),
  )
}

function parseOptionalNumber(value: string): number | undefined {
  if (value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function ReviewPage() {
  const { jobId } = Route.useParams()
  const navigate = useNavigate()
  const [ocr, setOcr] = useState<OcrResult | null>(null)
  const [quality, setQuality] = useState<{ warning?: string }>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [rechecking, setRechecking] = useState(false)
  const [recheckNote, setRecheckNote] = useState('')
  const [flagged, setFlagged] = useState<Set<string>>(new Set())

  useEffect(() => {
    jobsApi
      .ocr(jobId)
      .then((res) => {
        setOcr(res.correctedOcr ?? res.ocrResult)
        setQuality(res.quality ?? {})
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load OCR'))
      .finally(() => setLoading(false))
  }, [jobId])

  const display = useMemo(() => (ocr ? buildOcrDisplay(ocr) : null), [ocr])

  function toggleFlag(value: string) {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function updateSales(dayIdx: number, entryIdx: number, field: string, value: string) {
    if (!ocr?.sales) return
    const next = structuredClone(ocr)
    const entry = next.sales![dayIdx]!.entries![entryIdx]!
    if (field === 'product_raw') entry.product_raw = value
    if (field === 'tally_count') entry.tally_count = parseOptionalNumber(value)
    if (field === 'price_per_unit_ghs') entry.price_per_unit_ghs = parseOptionalNumber(value)
    if (field === 'row_total_ghs') entry.row_total_ghs = parseOptionalNumber(value)
    if (field === 'tally_count' || field === 'price_per_unit_ghs' || field === 'row_total_ghs') {
      entry.uncertain_fields = []
    }
    setOcr(next)
  }

  function adjustCount(dayIdx: number, entryIdx: number, delta: number) {
    if (!ocr?.sales) return
    const next = structuredClone(ocr)
    const entry = next.sales![dayIdx]!.entries![entryIdx]!
    entry.tally_count = Math.max(0, (entry.tally_count ?? 0) + delta)
    entry.uncertain_fields = []
    setOcr(next)
  }

  function updateCost(periodIdx: number, entryIdx: number, field: string, value: string) {
    if (!ocr?.costs) return
    const next = structuredClone(ocr)
    const entry = next.costs![periodIdx]!.entries![entryIdx]!
    if (field === 'product_raw') entry.product_raw = value
    if (field === 'price_per_pack_ghs') entry.price_per_pack_ghs = parseOptionalNumber(value)
    if (field === 'packs_bought') entry.packs_bought = parseOptionalNumber(value)
    entry.uncertain_fields = []
    setOcr(next)
  }

  async function onConfirm() {
    if (!ocr) return
    setConfirming(true)
    setError('')
    try {
      await jobsApi.saveOcr(jobId, ocr)
      await jobsApi.confirm(jobId)
      navigate({ to: '/processing', search: { jobId } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm')
      setConfirming(false)
    }
  }

  async function onRecheck() {
    if (!ocr || flagged.size === 0) return
    setRechecking(true)
    setError('')
    try {
      const res = await jobsApi.recheck(jobId, [...flagged], ocr)
      setOcr(res.correctedOcr)
      setQuality(res.quality ?? {})
      setFlagged(new Set())
      setRecheckNote('We re-read the flagged items. Please check again.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recheck failed')
    } finally {
      setRechecking(false)
    }
  }

  if (loading) {
    return (
      <main className="page text-center">
        <div className="spinner my-10" />
      </main>
    )
  }

  if (!ocr || !display) {
    return (
      <main className="page">
        <div className="flash-error">{error || 'No OCR data found'}</div>
      </main>
    )
  }

  return (
    <main className="page">
      {quality.warning && (
        <div className="quality-warning">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-bold text-[#7f1d1d]">Photo quality warning</div>
            <div className="text-sm text-[#991b1b]">{quality.warning}</div>
          </div>
        </div>
      )}

      {recheckNote && (
        <div className="recheck-note">🔄 {recheckNote}</div>
      )}

      <h1 className="mb-2 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--green-deep)]">
        Does this match your record book?
      </h1>

      <div className="card bg-[var(--green-pale)]" style={{ borderColor: 'var(--green-light)' }}>
        <div className="card-label text-[var(--green-deep)]">How to check</div>
        <div className="text-sm leading-relaxed text-[var(--green-deep)]">
          <p>👁️ Read each row and compare to your record book.</p>
          <p>☐ Tick anything that looks wrong.</p>
          <p>🔄 Tap &quot;Check again&quot; to re-read ticked items.</p>
          <p>✅ Tap the green button if everything looks right.</p>
        </div>
      </div>

      {error && <div className="flash-error">{error}</div>}

      {flagged.size > 0 && (
        <div className="flag-banner">
          {flagged.size} item{flagged.size > 1 ? 's' : ''} flagged. Fix with +/− or tap Check again.
        </div>
      )}

      {hasEditableSalesEntries(ocr) && (
        <>
          <div className="section-head">💰 Sales we read</div>
          {display.isTable && (
            <p className="mb-2 text-xs text-[var(--warm-gray)]">
              Table layout — each row has item, price, quantity sold, and row total (revenue column).
            </p>
          )}
          {(ocr.sales ?? []).map((day, dayIdx) => {
            const entries = day.entries ?? []
            if (!entries.length) return null
            return (
              <div key={dayIdx} className="card">
                <div className="card-label">{day.date ?? 'Unknown date'}</div>
                {entries.map((entry, entryIdx) => {
                  if (isPriceLabel(entry.product_raw ?? '')) return null

                  const name = entry.product_raw ?? ''
                  const flagValue = name.trim() ? `Sale: ${name.trim()}` : `Sale: ${dayIdx}:${entryIdx}`
                  const uncertain = Boolean(entry.uncertain_fields?.length)
                  const isFormatB = Boolean(entry.transactions?.length)
                  const isTableRow = display.isTable || entry.row_total_ghs != null
                  return (
                    <div
                      key={`${dayIdx}-${entryIdx}`}
                      className={`review-row ${uncertain ? 'review-row-uncertain' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="review-flag"
                        checked={flagged.has(flagValue)}
                        onChange={() => toggleFlag(flagValue)}
                        aria-label={`Flag ${name || 'item'}`}
                      />
                      <div className="min-w-0 flex-1">
                        <input
                          className="review-name-input"
                          value={name}
                          placeholder="Product name"
                          onChange={(ev) =>
                            updateSales(dayIdx, entryIdx, 'product_raw', ev.target.value)
                          }
                        />
                        {uncertain && (
                          <span className="text-xs text-[var(--amber)]"> ⚠️ uncertain</span>
                        )}
                        <div className="mt-1 text-xs text-[var(--warm-gray)]">
                          {isFormatB ? (
                            <span className="font-mono">
                              {(entry.transactions ?? []).join(' + ')} ={' '}
                              {entry.total_units_sold ??
                                (entry.transactions ?? []).reduce((a, b) => a + b, 0)}{' '}
                              units
                            </span>
                          ) : (
                            <span className="inline-flex flex-wrap items-center gap-1">
                              <button
                                type="button"
                                className="count-step"
                                onClick={() => adjustCount(dayIdx, entryIdx, -1)}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                className="count-input"
                                value={entry.tally_count ?? ''}
                                onChange={(ev) =>
                                  updateSales(dayIdx, entryIdx, 'tally_count', ev.target.value)
                                }
                                min={0}
                              />
                              <button
                                type="button"
                                className="count-step"
                                onClick={() => adjustCount(dayIdx, entryIdx, 1)}
                              >
                                +
                              </button>
                              sold · GHS
                              <input
                                type="number"
                                className="price-input"
                                step="0.01"
                                value={entry.price_per_unit_ghs ?? ''}
                                onChange={(ev) =>
                                  updateSales(dayIdx, entryIdx, 'price_per_unit_ghs', ev.target.value)
                                }
                                min={0}
                              />
                              each
                              {isTableRow && (
                                <>
                                  {' '}
                                  · row total GHS
                                  <input
                                    type="number"
                                    className="price-input"
                                    step="0.01"
                                    value={entry.row_total_ghs ?? ''}
                                    onChange={(ev) =>
                                      updateSales(dayIdx, entryIdx, 'row_total_ghs', ev.target.value)
                                    }
                                    min={0}
                                  />
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </>
      )}

      {display.costEntries.length > 0 && (
        <>
          <div className="section-head">🛒 Costs we read</div>
          <div className="card">
            {(ocr.costs ?? []).flatMap((period, periodIdx) =>
              (period.entries ?? []).map((entry, entryIdx) => {
                const name = entry.product_raw ?? ''
                const flagValue = name.trim() ? `Cost: ${name.trim()}` : `Cost: ${periodIdx}:${entryIdx}`
                const flatIdx =
                  (ocr.costs ?? [])
                    .slice(0, periodIdx)
                    .reduce((n, p) => n + (p.entries ?? []).length, 0) + entryIdx
                const disp = display.costEntries[flatIdx]
                return (
                  <div
                    key={`${periodIdx}-${entryIdx}`}
                    className={`review-row ${disp?.uncertain ? 'review-row-uncertain' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="review-flag"
                      checked={flagged.has(flagValue)}
                      onChange={() => toggleFlag(flagValue)}
                    />
                    <div className="min-w-0 flex-1 text-sm">
                      <input
                        className="review-name-input"
                        value={name}
                        placeholder="Product name"
                        onChange={(ev) =>
                          updateCost(periodIdx, entryIdx, 'product_raw', ev.target.value)
                        }
                      />
                      <div className="mt-1 text-[var(--warm-gray)]">{disp?.algebraStr}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          type="number"
                          className="price-input"
                          placeholder="Price/pack"
                          value={entry.price_per_pack_ghs ?? ''}
                          onChange={(ev) =>
                            updateCost(periodIdx, entryIdx, 'price_per_pack_ghs', ev.target.value)
                          }
                        />
                        <input
                          type="number"
                          className="count-input"
                          placeholder="Packs"
                          value={entry.packs_bought ?? ''}
                          onChange={(ev) =>
                            updateCost(periodIdx, entryIdx, 'packs_bought', ev.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )
              }),
            )}
          </div>
        </>
      )}

      {display.ingredientEntries.length > 0 && (
        <>
          <div className="section-head">🥘 Ingredients we read</div>
          <div className="card">
            {display.ingredientEntries.map((e) => (
              <div key={e.name} className="review-row">
                <input
                  type="checkbox"
                  className="review-flag"
                  checked={flagged.has(`Cost: ${e.name}`)}
                  onChange={() => toggleFlag(`Cost: ${e.name}`)}
                />
                <div className="flex-1 text-sm">
                  <strong>{e.name}</strong>
                  <div className="text-[var(--warm-gray)]">{e.totalStr}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {display.leftoverEntries.length > 0 && (
        <>
          <div className="section-head text-[var(--green-mid)]">✅ Leftover we read</div>
          <div className="card" style={{ borderColor: 'var(--green-light)' }}>
            {display.leftoverEntries.map((e) => (
              <div key={e.name} className="review-row">
                <input
                  type="checkbox"
                  className="review-flag"
                  checked={flagged.has(`Leftover: ${e.name}`)}
                  onChange={() => toggleFlag(`Leftover: ${e.name}`)}
                />
                <div className="flex-1 text-sm">
                  <strong>{e.name}</strong>
                  <div className="text-[var(--green-mid)]">{e.totalStr} — carries forward</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {display.spoilageEntries.length > 0 && (
        <>
          <div className="section-head text-[var(--red)]">⚠️ Spoilage we read</div>
          <div className="card" style={{ borderColor: '#fca5a5' }}>
            {display.spoilageEntries.map((e) => (
              <div key={e.name} className="review-row">
                <input
                  type="checkbox"
                  className="review-flag"
                  checked={flagged.has(`Spoilage: ${e.name}`)}
                  onChange={() => toggleFlag(`Spoilage: ${e.name}`)}
                />
                <div className="flex-1 text-sm">
                  <strong>{e.name}</strong>
                  <div className="text-[var(--red)]">{e.totalStr} — lost</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button type="button" className="btn-primary" onClick={onConfirm} disabled={confirming}>
        {confirming ? 'Calculating…' : '✅ Yes, everything looks right — run the analysis'}
      </button>

      <button
        type="button"
        className={`btn-recheck ${flagged.size === 0 ? 'btn-recheck-disabled' : ''}`}
        onClick={() => void onRecheck()}
        disabled={rechecking || flagged.size === 0}
      >
        {rechecking ? 'Checking again…' : '🔄 Check the ticked items again'}
      </button>

      <Link to="/upload" search={{ weekStart: undefined }} className="btn-danger mt-3">
        <span aria-hidden>❌</span>
        <span>A lot is wrong — upload again</span>
      </Link>

      <div className="card mt-3 bg-[#f8f8f6]">
        <div className="card-label">Tips for better photos</div>
        <div className="text-sm leading-relaxed text-[var(--warm-gray)]">
          📖 Lay the book flat · 💡 Good lighting · 📸 From directly above · ✍️ Clear numbers
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute('/review/$jobId')({
  component: ReviewPage,
})

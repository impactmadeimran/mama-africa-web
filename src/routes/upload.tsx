import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Field } from '#/components/Field'
import { jobsApi } from '#/lib/api'

export const Route = createFileRoute('/upload')({
  validateSearch: (search: Record<string, unknown>) => ({
    weekStart: typeof search.weekStart === 'string' ? search.weekStart : undefined,
  }),
  component: UploadPage,
})

function mondayOfWeek(d = new Date()) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date.toISOString().slice(0, 10)
}

function UploadPage() {
  const navigate = useNavigate()
  const { weekStart: weekStartParam } = Route.useSearch()
  const [files, setFiles] = useState<File[]>([])
  const [weekStart, setWeekStart] = useState(weekStartParam ?? mondayOfWeek())
  const [sellingDays, setSellingDays] = useState(6)
  const [restockFrequency, setRestockFrequency] = useState('week')
  const [restockType, setRestockType] = useState<'full' | 'topup' | 'none'>('full')
  const [vendorRetail, setVendorRetail] = useState(true)
  const [vendorFood, setVendorFood] = useState(false)
  const [vendorFormatB, setVendorFormatB] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const previews = useMemo(
    () => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [files],
  )

  function onFiles(selected: FileList | null) {
    if (!selected) return
    setFiles(Array.from(selected).slice(0, 10))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!files.length) {
      setError('Please select at least one photo.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      files.forEach((f) => form.append('photos', f))
      form.append('weekStart', weekStart)
      form.append('sellingDays', String(sellingDays))
      form.append('restockFrequency', restockFrequency)
      form.append('restockType', restockType)
      if (vendorFormatB) form.append('uploadType', 'format_b')
      else {
        if (vendorRetail) form.append('uploadType', 'retail')
        if (vendorFood) form.append('uploadType', 'food')
      }
      if (!vendorFormatB && !vendorRetail && !vendorFood) {
        setError('Please choose at least one record type.')
        setLoading(false)
        return
      }
      const { jobId } = await jobsApi.create(form)
      navigate({ to: '/processing', search: { jobId } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <div className="card">
        <div className="card-label">Weekly upload</div>
        <h1 className="mb-3 font-[family-name:var(--font-display)] text-xl font-bold">
          Photograph your notebook
        </h1>
        <p className="mb-4 text-sm text-[var(--warm-gray)]">
          Take clear photos of your sales and cost pages for this week.
        </p>
        {error && <div className="flash-error">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <Field
            label="Notebook photos"
            hint="Tap to choose photos. JPG, PNG, or WEBP. Up to 10 photos — one page per photo is best."
          >
            <label className="block cursor-pointer rounded-[12px] border-2 border-dashed border-[var(--green-mid)] bg-[var(--green-pale)] p-6 text-center">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
              <div className="text-3xl">📷</div>
              <div className="mt-2 font-semibold text-[var(--green-deep)]">Tap to add photos</div>
            </label>
          </Field>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((p) => (
                <img
                  key={p.url}
                  src={p.url}
                  alt={p.name}
                  className="aspect-square rounded-[8px] object-cover"
                />
              ))}
            </div>
          )}

          <div className="card !mb-0">
            <div className="card-label">Which week is this for?</div>
            <Field label="Week starting (optional)" hint="Defaults to Monday of this week.">
              <input
                className="input"
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
            </Field>
          </div>

          <div className="card !mb-0">
            <div className="card-label">About this week</div>
            <Field label="How many days did you sell this week?">
              <select
                className="input"
                value={sellingDays}
                onChange={(e) => setSellingDays(Number(e.target.value))}
              >
                {[7, 6, 5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'day' : 'days'}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="How often did you buy supplies this period?">
              <select
                className="input"
                value={restockFrequency}
                onChange={(e) => setRestockFrequency(e.target.value)}
              >
                <option value="daily">Every day</option>
                <option value="few_days">Every 2–3 days</option>
                <option value="week">Every week</option>
                <option value="2_weeks">Every 2 weeks</option>
                <option value="month">Once a month</option>
              </select>
            </Field>
            {['2_weeks', 'month'].includes(restockFrequency) && (
              <Field
                label="What kind of buying did you do this week?"
                hint="This affects how your costs are split across weeks."
              >
                <div className="restock-cards">
                  {(
                    [
                      {
                        value: 'full' as const,
                        title: '📦 My regular big restock',
                        hint: 'Bought a full stock-up for the period',
                      },
                      {
                        value: 'topup' as const,
                        title: '➕ Just filling the gaps',
                        hint: 'Small top-up on top of what I already have',
                      },
                      {
                        value: 'none' as const,
                        title: '⏭️ I didn\'t restock this week',
                        hint: 'No new supplies — using what I already have',
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`restock-card ${restockType === opt.value ? 'selected' : ''}`}
                      onClick={() => setRestockType(opt.value)}
                    >
                      <div
                        className="mt-0.5 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-[var(--border)]"
                        style={
                          restockType === opt.value
                            ? { background: 'var(--green-mid)', borderColor: 'var(--green-mid)' }
                            : undefined
                        }
                      />
                      <div>
                        <div className="text-sm font-bold">{opt.title}</div>
                        <div className="text-xs text-[var(--warm-gray)]">{opt.hint}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Field>
            )}
          </div>

          <div className="card !mb-0">
            <div className="card-label">What records are you uploading?</div>
            <p className="mb-2 text-xs text-[var(--warm-gray)]">Tick all that apply</p>
            <label className="vendor-check">
              <input
                type="checkbox"
                checked={vendorRetail}
                disabled={vendorFormatB}
                onChange={(e) => setVendorRetail(e.target.checked)}
              />
              <div>
                <div className="text-sm font-semibold">📦 Packaged or pre-made goods</div>
                <div className="text-xs text-[var(--warm-gray)]">
                  Water, snacks, soap — not cooked food
                </div>
              </div>
            </label>
            <label className="vendor-check">
              <input
                type="checkbox"
                checked={vendorFood}
                disabled={vendorFormatB}
                onChange={(e) => setVendorFood(e.target.checked)}
              />
              <div>
                <div className="text-sm font-semibold">🍲 Cooked food</div>
                <div className="text-xs text-[var(--warm-gray)]">
                  Rice, yam, stew — made from ingredients
                </div>
              </div>
            </label>
            <label className="vendor-check">
              <input
                type="checkbox"
                checked={vendorFormatB}
                onChange={(e) => {
                  setVendorFormatB(e.target.checked)
                  if (e.target.checked) {
                    setVendorRetail(false)
                    setVendorFood(false)
                  } else {
                    setVendorRetail(true)
                  }
                }}
              />
              <div>
                <div className="text-sm font-semibold">💧 Water / bulk goods</div>
                <div className="text-xs text-[var(--warm-gray)]">
                  Individual transaction counts e.g. 10 + 10 + 5
                </div>
              </div>
            </label>
          </div>

          <div className="card bg-[#fffbeb]" style={{ borderColor: '#fde68a' }}>
            <div className="card-label text-[#92400e]">📷 Tips for a good photo</div>
            <ul className="list-disc pl-5 text-sm leading-relaxed text-[#78350f]">
              <li>Hold phone directly above the page</li>
              <li>Make sure all writing is visible</li>
              <li>Use good light — no shadows</li>
              <li>Keep the page flat</li>
            </ul>
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !files.length}>
            {loading ? (
              <span>Uploading…</span>
            ) : (
              <>
                <span aria-hidden>📤</span>
                <span>Send My Records</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  )
}

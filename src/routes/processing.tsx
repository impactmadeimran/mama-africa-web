import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { jobsApi } from '#/lib/api'

const STEPS = [
  'Reading your photos',
  'Reading your sales records',
  'Reading your costs',
  'Getting ready to show you',
]

export const Route = createFileRoute('/processing')({
  validateSearch: (search: Record<string, unknown>) => ({
    jobId: String(search.jobId ?? ''),
  }),
  component: ProcessingPage,
})

function ProcessingPage() {
  const { jobId } = Route.useSearch()
  const navigate = useNavigate()
  const [status, setStatus] = useState('queued')
  const [error, setError] = useState('')
  const [stepIdx, setStepIdx] = useState(0)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    if (!jobId) {
      navigate({ to: '/upload', search: { weekStart: undefined } })
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    let attempts = 0

    async function poll() {
      try {
        const res = await jobsApi.status(jobId)
        if (cancelled) return
        setStatus(res.status)
        attempts++
        if (attempts % 5 === 0) setStepIdx((i) => Math.min(i + 1, STEPS.length - 1))

        if (res.status === 'ocr_complete') {
          navigate({ to: '/review/$jobId', params: { jobId } })
          return
        }
        if (res.status === 'complete') {
          setStepIdx(STEPS.length - 1)
          setComplete(true)
          timer = setTimeout(() => navigate({ to: '/dashboard' }), 1200)
          return
        }
        if (res.status === 'error') {
          setError(res.error ?? 'Processing failed')
          return
        }
        timer = setTimeout(poll, res.status === 'queued' ? 3000 : 5000)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not check status')
        timer = setTimeout(poll, 7000)
      }
    }

    timer = setTimeout(poll, 3000)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [jobId, navigate])

  return (
    <main className="page text-center">
      {!complete && !error && <div className="spinner my-8" />}
      {!complete && !error && (
        <>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--green-deep)]">
            {status === 'ocr_processing'
              ? 'Reading your records...'
              : status === 'processing'
                ? 'Calculating your report...'
                : 'Reading your records...'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--warm-gray)]">
            This can take up to <strong>10 minutes</strong> on the first step.
            <br />
            <strong>You can put your phone down</strong> and come back to check.
            <br />
            The page will update automatically when it is ready.
          </p>
          <div className="mx-auto mt-6 max-w-[260px] text-left">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className="flex items-center gap-2 border-b border-[var(--border)] py-2 text-sm font-semibold"
                style={{ opacity: i <= stepIdx ? 1 : 0.3 }}
              >
                <span>{i < stepIdx ? '✅' : i === stepIdx ? '🔄' : '⏳'}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {complete && (
        <>
          <div className="text-5xl">🎉</div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--green-deep)]">
            Your report is ready!
          </h1>
          <p className="mt-2 text-sm text-[var(--warm-gray)]">Taking you there now...</p>
        </>
      )}
      {error && (
        <div className="alert-badge alert-warning mt-4 text-left">
          <span>❌</span>
          <div>
            <strong>Something went wrong.</strong>
            <br />
            {error}
            <br />
            <Link to="/upload" search={{ weekStart: undefined }} className="font-bold text-[var(--red)]">
              Try uploading again →
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}

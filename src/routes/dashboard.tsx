import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import DashboardView from '#/components/DashboardView'
import { reportsApi } from '#/lib/api'
import type { DashboardPayload } from '#/lib/types'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    reportsApi
      .dashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load report'))
  }, [])

  if (error) {
    return (
      <main className="page">
        <div className="flash-error">{error}</div>
        <Link to="/login" className="btn-secondary mt-3">
          Sign in
        </Link>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="page text-center">
        <div className="spinner my-10" />
      </main>
    )
  }

  if (!data.report) {
    return (
      <main className="page">
        <div className="text-center" style={{ padding: '36px 0 24px' }}>
          <div className="text-5xl">👋</div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--green-deep)]">
            Hello!
          </h1>
          <p className="mt-2 text-sm text-[var(--warm-gray)]">
            Your account is ready.
            <br />
            Upload your first week&apos;s records to see your results.
          </p>
        </div>
        <div className="card bg-[var(--green-pale)]" style={{ borderColor: 'var(--green-light)' }}>
          <div className="card-label text-[var(--green-deep)]">How it works</div>
          <div className="onboard-step">
            <div className="onboard-num">1</div>
            <div className="text-2xl">📸</div>
            <div className="text-sm leading-snug">
              <strong className="block">Photo your sales and costs pages</strong>
              Keep the page flat and the writing clear.
            </div>
          </div>
          <div className="onboard-step">
            <div className="onboard-num">2</div>
            <div className="text-2xl">⬆️</div>
            <div className="text-sm leading-snug">
              <strong className="block">Upload using the Upload button below</strong>
              Up to 10 photos at once.
            </div>
          </div>
          <div className="onboard-step">
            <div className="onboard-num">3</div>
            <div className="text-2xl">📊</div>
            <div className="text-sm leading-snug">
              <strong className="block">Come back here for your results</strong>
              Ready in about 2 minutes.
            </div>
          </div>
        </div>
        <Link to="/upload" search={{ weekStart: undefined }} className="btn-primary">
          <span aria-hidden>📸</span>
          <span>Upload My Records</span>
        </Link>
      </main>
    )
  }

  return (
    <main className="page">
      <DashboardView data={data} />
    </main>
  )
}

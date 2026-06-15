import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import DashboardView from '#/components/DashboardView'
import { reportsApi } from '#/lib/api'
import type { DashboardPayload } from '#/lib/types'

export const Route = createFileRoute('/report/$weekStart')({
  component: ReportPage,
})

function ReportPage() {
  const { weekStart } = Route.useParams()
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    reportsApi
      .weekDashboard(weekStart)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load report'))
  }, [weekStart])

  if (error) {
    return (
      <main className="page">
        <div className="flash-error">{error}</div>
        <Link to="/history" className="btn-secondary mt-3">
          <span aria-hidden>←</span>
          <span>Back to history</span>
        </Link>
      </main>
    )
  }

  if (!data?.report) {
    return (
      <main className="page text-center">
        <div className="spinner my-10" />
      </main>
    )
  }

  return (
    <main className="page">
      <DashboardView
        data={data}
        showRecentWeeks={false}
        backLink={{ to: '/history', label: 'Back to history' }}
      />
    </main>
  )
}

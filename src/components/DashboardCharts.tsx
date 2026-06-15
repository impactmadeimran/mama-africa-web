import { useEffect, useRef } from 'react'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip,
  DoughnutController,
  ArcElement,
} from 'chart.js'
import type { ProductBreakdown } from '#/lib/types'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip,
  DoughnutController,
  ArcElement,
)

type Props = {
  chartWeeks: string[]
  chartRevenue: number[]
  chartProfit: number[]
  products: ProductBreakdown[]
}

export default function DashboardCharts({ chartWeeks, chartRevenue, chartProfit, products }: Props) {
  const trendRef = useRef<HTMLCanvasElement>(null)
  const pieRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const charts: Chart[] = []

    if (trendRef.current && chartWeeks.length >= 2) {
      charts.push(
        new Chart(trendRef.current, {
          type: 'line',
          data: {
            labels: chartWeeks,
            datasets: [
              {
                label: 'Money made',
                data: chartRevenue,
                borderColor: '#56c289',
                backgroundColor: 'rgba(86,194,137,0.1)',
                borderWidth: 2.5,
                pointBackgroundColor: '#56c289',
                pointRadius: 4,
                tension: 0.3,
                fill: true,
              },
              {
                label: 'Money kept',
                data: chartProfit,
                borderColor: '#1b4d35',
                borderWidth: 2,
                pointBackgroundColor: '#1b4d35',
                pointRadius: 4,
                tension: 0.3,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
            },
            scales: {
              y: {
                ticks: {
                  callback: (v) => `GHS ${v}`,
                },
              },
            },
          },
        }),
      )
    }

    if (pieRef.current) {
      const filtered = [...products]
        .filter((p) => p.revenue > 0 && (p.unitsSold ?? 0) > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8)
      if (filtered.length) {
        charts.push(
          new Chart(pieRef.current, {
            type: 'doughnut',
            data: {
              labels: filtered.map((p) => p.name),
              datasets: [
                {
                  data: filtered.map((p) => p.revenue),
                  backgroundColor: [
                    '#2d6a4f',
                    '#e76f51',
                    '#457b9d',
                    '#e9c46a',
                    '#9b5de5',
                    '#f72585',
                    '#4cc9f0',
                    '#f4a261',
                  ],
                  borderWidth: 2,
                  borderColor: '#fff',
                },
              ],
            },
            options: {
              responsive: true,
              cutout: '58%',
              plugins: { legend: { position: 'bottom' } },
            },
          }),
        )
      }
    }

    return () => charts.forEach((c) => c.destroy())
  }, [chartWeeks, chartRevenue, chartProfit, products])

  return (
    <>
      {chartWeeks.length >= 2 && (
        <div className="card">
          <div className="card-label">Money made & kept — last {chartWeeks.length} weeks</div>
          <canvas ref={trendRef} height={145} />
        </div>
      )}
      {products.length > 0 && (
        <div className="card">
          <div className="card-label">Which products bring in the most money</div>
          <canvas ref={pieRef} height={200} />
        </div>
      )}
    </>
  )
}

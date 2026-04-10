import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function RTTGraph({ series = [], maxPoints = 50 }) {
  const limited = series.slice(-maxPoints)
  const labels = limited.map((_, i) => i + 1)
  const data = limited.map((p) => (typeof p === 'number' ? p : p.rtt))

  const chartData = {
    labels,
    datasets: [
      {
        label: 'RTT (ms)',
        data,
        borderColor: '#00F5FF',
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260)
          g.addColorStop(0, 'rgba(0,245,255,0.25)')
          g.addColorStop(1, 'rgba(0,245,255,0.0)')
          return g
        },
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#00F5FF',
        pointBorderColor: '#060B14',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(13,22,40,0.95)',
        borderColor: 'rgba(0,245,255,0.3)',
        borderWidth: 1,
        titleColor: '#00F5FF',
        bodyColor: '#CBD5E0',
        callbacks: { label: (ctx) => ` ${ctx.parsed.y.toFixed(1)} ms` },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(26,41,66,0.6)', drawBorder: false },
        ticks: { color: '#4A5568', font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 10 },
      },
      y: {
        grid: { color: 'rgba(26,41,66,0.6)', drawBorder: false },
        ticks: {
          color: '#4A5568',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (v) => v + 'ms',
        },
      },
    },
  }

  return (
    <div style={{ height: 260, position: 'relative' }}>
      {data.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-cyber-muted text-sm font-mono">
          — No data yet —
        </div>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  )
}

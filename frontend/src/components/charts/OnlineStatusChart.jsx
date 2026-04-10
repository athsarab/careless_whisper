import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function OnlineStatusChart({ online = 0, screenActive = 0 }) {
  const onlinePct = Math.round(online * 100)
  const screenPct = Math.round(screenActive * 100)

  const makeData = (pct, color, bg) => ({
    datasets: [{
      data: [pct, 100 - pct],
      backgroundColor: [color, bg],
      borderWidth: 0,
      hoverOffset: 0,
    }],
  })

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '78%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    animation: { duration: 800, easing: 'easeInOutElastic' },
  }

  return (
    <div className="flex items-center justify-around gap-6">
      {/* Online Probability */}
      <div className="flex flex-col items-center gap-2">
        <div style={{ width: 110, height: 110, position: 'relative' }}>
          <Doughnut data={makeData(onlinePct, '#00FF9C', 'rgba(0,255,156,0.08)')} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-bold text-cyber-green">{onlinePct}%</span>
          </div>
        </div>
        <span className="text-xs font-mono text-cyber-muted">ONLINE PROB</span>
      </div>

      {/* Screen Active */}
      <div className="flex flex-col items-center gap-2">
        <div style={{ width: 110, height: 110, position: 'relative' }}>
          <Doughnut data={makeData(screenPct, '#8B5CF6', 'rgba(139,92,246,0.08)')} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-bold text-cyber-purple">{screenPct}%</span>
          </div>
        </div>
        <span className="text-xs font-mono text-cyber-muted">SCREEN ACTIVE</span>
      </div>
    </div>
  )
}

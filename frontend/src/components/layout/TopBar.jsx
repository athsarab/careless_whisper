import { useEffect, useState } from 'react'
import { Wifi, WifiOff, Clock } from 'lucide-react'

export default function TopBar({ title, subtitle, socketConnected }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-cyber-border"
      style={{ background: 'rgba(13, 22, 40, 0.9)', backdropFilter: 'blur(12px)' }}>
      <div>
        <h1 className="text-base font-semibold text-cyber-text">{title}</h1>
        {subtitle && <p className="text-xs text-cyber-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {/* Socket status */}
        <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border ${
          socketConnected
            ? 'text-cyber-green border-cyber-green/30 bg-cyber-green/10'
            : 'text-cyber-red border-cyber-red/30 bg-cyber-red/10'
        }`}>
          {socketConnected
            ? <><Wifi size={11} /><span>WS LIVE</span></>
            : <><WifiOff size={11} /><span>WS OFF</span></>
          }
        </div>
        {/* Clock */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-cyber-muted">
          <Clock size={12} />
          <span>{time.toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>
        {/* Scan line decoration */}
        <div className="w-24 h-px relative overflow-hidden rounded">
          <div style={{ background: 'linear-gradient(90deg, transparent, #00F5FF, transparent)', height: '1px', width: '100%' }} />
        </div>
      </div>
    </header>
  )
}

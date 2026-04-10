import { Smartphone, Monitor, Tablet, Laptop } from 'lucide-react'

const icons = [Smartphone, Tablet, Laptop, Monitor]

export default function DeviceCountGauge({ count = 1 }) {
  const clamped = Math.min(count, 4)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-3">
        {icons.map((Icon, i) => {
          const active = i < clamped
          return (
            <div key={i} className="flex flex-col items-center gap-1 transition-all duration-500">
              <Icon
                size={26 + i * 3}
                className={`transition-all duration-500 ${
                  active ? 'text-cyber-accent' : 'text-cyber-muted/30'
                }`}
                style={active ? {
                  filter: 'drop-shadow(0 0 8px rgba(0,245,255,0.6))',
                } : {}}
              />
              {active && (
                <div className="w-1 h-1 rounded-full bg-cyber-accent animate-pulse" />
              )}
            </div>
          )
        })}
      </div>
      <div className="text-center">
        <span className="text-3xl font-mono font-bold text-cyber-accent">{count}</span>
        <span className="text-xs font-mono text-cyber-muted ml-2">LINKED DEVICE{count !== 1 ? 'S' : ''}</span>
      </div>
    </div>
  )
}

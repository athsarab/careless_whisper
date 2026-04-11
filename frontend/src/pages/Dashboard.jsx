import { useEffect, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import api from '../services/api'
import RTTGraph from '../components/charts/RTTGraph'
import OnlineStatusChart from '../components/charts/OnlineStatusChart'
import DeviceCountGauge from '../components/charts/DeviceCountGauge'
import { Activity, Radio, Inbox, Cpu, TrendingUp, Zap, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, sub, color = 'cyan', glow }) {
  const colors = {
    cyan:   { text: 'text-cyber-accent',  border: 'border-cyber-accent/20',  bg: 'bg-cyber-accent/5'  },
    green:  { text: 'text-cyber-green',   border: 'border-cyber-green/20',   bg: 'bg-cyber-green/5'   },
    red:    { text: 'text-cyber-red',     border: 'border-cyber-red/20',     bg: 'bg-cyber-red/5'     },
    purple: { text: 'text-cyber-purple',  border: 'border-cyber-purple/20',  bg: 'bg-cyber-purple/5'  },
  }
  const c = colors[color]
  return (
    <div className={`glass-card p-5 border ${c.border} ${c.bg} ${glow ? 'glow-' + color : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${c.bg} border ${c.border}`}>
          <Icon size={18} className={c.text} />
        </div>
        <span className="text-xs font-mono text-cyber-muted tracking-widest uppercase">{label}</span>
      </div>
      <div className={`text-3xl font-mono font-bold ${c.text}`}>{value}</div>
      {sub && <div className="text-xs text-cyber-muted mt-1 font-mono">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState({ total_probes: 0, total_receipts: 0, latest_analyses: [] })
  const [rttSeries, setRttSeries] = useState([])
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [simRunning, setSimRunning] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, devRes, simRes, rttRes] = await Promise.all([
        api.get('/analysis/summary'),
        api.get('/devices'),
        api.get('/simulator/status'),
        api.get('/analysis/rtt'),
      ])
      setSummary(sumRes.data)
      setDevices(devRes.data)
      setSimRunning(simRes.data.running)
      setRttSeries(rttRes.data.series.map(s => s.rtt).filter(Boolean))
      if (!selectedDevice && devRes.data.length > 0) {
        setSelectedDevice(devRes.data[0])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedDevice])

  useEffect(() => {
    fetchData()
    const socket = io('/', { transports: ['websocket', 'polling'] })
    socket.on('receipt:captured', (data) => {
      setRttSeries(prev => [...prev.slice(-49), data.rtt_ms])
      setSummary(prev => ({ ...prev, total_receipts: prev.total_receipts + 1 }))
    })
    socket.on('probe:sent', () => {
      setSummary(prev => ({ ...prev, total_probes: prev.total_probes + 1 }))
    })
    socket.on('analysis:updated', (data) => {
      setAnalysis(data)
    })
    return () => socket.disconnect()
  }, [])

  const fetchDeviceAnalysis = async (device) => {
    setSelectedDevice(device)
    try {
      const res = await api.get(`/analysis/status/${device.id}`)
      setAnalysis(res.data)
    } catch {}
  }

  const toggleSimulator = async () => {
    try {
      const endpoint = simRunning ? '/simulator/stop' : '/simulator/start'
      await api.post(endpoint)
      setSimRunning(!simRunning)
      toast.success(simRunning ? 'Simulator stopped' : 'Simulator started')
    } catch {
      toast.error('Failed to toggle simulator')
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cyber-accent/30 border-t-cyber-accent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-cyber-muted">LOADING SYSTEM DATA...</p>
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 page-enter">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-cyber-text">Research Dashboard</h2>
          <p className="text-xs text-cyber-muted font-mono">Real-time metadata analysis · Academic use only</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-cyber py-1.5 px-3 flex items-center gap-1.5 text-xs">
            <RefreshCw size={12} /> REFRESH
          </button>
          <button id="toggle-sim" onClick={toggleSimulator}
            className={`btn-cyber py-1.5 px-3 flex items-center gap-1.5 text-xs ${simRunning ? 'btn-danger' : 'btn-green'}`}>
            <Zap size={12} />
            {simRunning ? 'STOP SIM' : 'START SIM'}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Radio}    label="Total Probes"   value={summary.total_probes}   sub="Sent this session" color="cyan"   glow />
        <StatCard icon={Inbox}    label="Receipts"       value={summary.total_receipts} sub="Acknowledgments"   color="green"  />
        <StatCard icon={Cpu}      label="Devices"        value={devices.length}         sub="Authorized"        color="purple" />
        <StatCard icon={Activity} label="Analyses"       value={summary.latest_analyses.length} sub="Sessions" color="cyan"  />
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* RTT Graph */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
                <TrendingUp size={14} className="text-cyber-accent" />
                Round-Trip Time
              </h3>
              <p className="text-xs text-cyber-muted font-mono">Live RTT latency • ms</p>
            </div>
            {rttSeries.length > 0 && (
              <span className="tag tag-cyan">
                avg {(rttSeries.reduce((a,b)=>a+b,0)/rttSeries.length).toFixed(0)}ms
              </span>
            )}
          </div>
          <RTTGraph series={rttSeries} />
        </div>

        {/* Status + Devices */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-cyber-text mb-4">Status Prediction</h3>
            {analysis ? (
              <OnlineStatusChart online={analysis.online_probability} screenActive={analysis.screen_active_prob} />
            ) : (
              <p className="text-xs text-cyber-muted font-mono text-center py-8">Select a device to analyze</p>
            )}
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-cyber-text mb-4">Linked Devices</h3>
            <DeviceCountGauge count={analysis?.linked_device_count || 1} />
          </div>
        </div>
      </div>

      {/* Device list + Recent analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Device selector */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-cyber-text mb-4">Test Devices</h3>
          <div className="space-y-2">
            {devices.length === 0 && (
              <p className="text-xs text-cyber-muted font-mono">No devices registered. Add via Admin Panel.</p>
            )}
            {devices.map(d => (
              <button key={d.id} onClick={() => fetchDeviceAnalysis(d)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  selectedDevice?.id === d.id
                    ? 'border-cyber-accent/50 bg-cyber-accent/10'
                    : 'border-cyber-border hover:border-cyber-accent/30 hover:bg-white/5'
                }`}>
                <span className={`status-dot ${d.consent_verified ? 'online' : 'offline'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono text-cyber-text truncate">{d.label || d.phone_number}</div>
                  <div className="text-xs text-cyber-muted">{d.phone_number}</div>
                </div>
                {d.consent_verified
                  ? <span className="tag tag-green">Authorized</span>
                  : <span className="tag tag-red">No Consent</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Latest analyses */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-cyber-text mb-4">Recent Analyses</h3>
          <div className="space-y-2">
            {summary.latest_analyses.slice(0, 5).map(ar => (
              <div key={ar.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-cyber-border">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-cyber-text">{ar.device_id.slice(0, 8)}…</div>
                  <div className="text-xs text-cyber-muted">{new Date(ar.analyzed_at).toLocaleString()}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs font-mono text-cyber-green">{(ar.online_probability*100).toFixed(0)}% online</div>
                  <div className="text-xs font-mono text-cyber-accent">{ar.avg_rtt_ms.toFixed(0)}ms RTT</div>
                </div>
              </div>
            ))}
            {summary.latest_analyses.length === 0 && (
              <p className="text-xs text-cyber-muted font-mono">Run probes to generate analysis data.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import api from '../services/api'
import RTTGraph from '../components/charts/RTTGraph'
import OnlineStatusChart from '../components/charts/OnlineStatusChart'
import DeviceCountGauge from '../components/charts/DeviceCountGauge'
import { BarChart3, Play, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

export default function RTTAnalysis() {
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [history, setHistory] = useState([])
  const [rttSeries, setRttSeries] = useState([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    api.get('/devices').then(r => {
      setDevices(r.data)
      if (r.data.length) setSelectedDevice(r.data[0])
    })
    api.get('/analysis/rtt').then(r => {
      setRttSeries(r.data.series.map(s => s.rtt).filter(Boolean))
    })

    const socket = io('/', { transports: ['websocket', 'polling'] })
    socket.on('receipt:captured', d => {
      setRttSeries(prev => [...prev.slice(-49), d.rtt_ms])
    })
    socket.on('analysis:updated', d => {
      setAnalysis(d)
      setHistory(prev => [d, ...prev.slice(0, 9)])
    })
    return () => socket.disconnect()
  }, [])

  useEffect(() => {
    if (!selectedDevice) return
    api.get(`/analysis/status/${selectedDevice.id}`).then(r => {
      setAnalysis(r.data)
      setRttSeries(r.data.rtt_series || [])
    }).catch(() => setAnalysis(null))

    api.get(`/analysis/history/${selectedDevice.id}`).then(r => setHistory(r.data))
  }, [selectedDevice])

  const runAnalysis = async () => {
    if (!selectedDevice) { toast.error('Select a device'); return }
    setRunning(true)
    try {
      const res = await api.post('/analysis/run', { device_id: selectedDevice.id })
      setAnalysis(res.data)
      setHistory(prev => [res.data, ...prev.slice(0, 9)])
      if (res.data.rtt_series) setRttSeries(res.data.rtt_series)
      toast.success('Analysis complete')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 page-enter">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-cyber-text">RTT Analysis Engine</h2>
          <p className="text-xs text-cyber-muted font-mono">Pattern detection · Device estimation · State inference</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Device picker */}
          <div className="relative">
            <select
            className="cyber-input pr-8 appearance-none text-sm min-w-[220px]"
              value={selectedDevice?.id || ''}
              onChange={e => setSelectedDevice(devices.find(d => d.id === e.target.value))}
            >
              {devices.map(d => <option key={d.id} value={d.id}>{d.label || d.phone_number}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-cyber-muted pointer-events-none" />
          </div>
          <button id="run-analysis-btn" onClick={runAnalysis} disabled={running}
            className="btn-green py-2 px-4 flex items-center gap-2 text-sm font-mono disabled:opacity-50">
            {running
              ? <><div className="w-4 h-4 border-2 border-cyber-green/30 border-t-cyber-green rounded-full animate-spin" /><span>ANALYZING...</span></>
              : <><Play size={13} /><span>RUN ANALYSIS</span></>
            }
          </button>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-cyber-accent" />
            <h3 className="text-sm font-semibold text-cyber-text">RTT Time Series</h3>
            {rttSeries.length > 0 && (
              <span className="tag tag-cyan ml-auto">
                {rttSeries.length} samples · avg {(rttSeries.reduce((a,b)=>a+b,0)/rttSeries.length).toFixed(0)}ms
              </span>
            )}
          </div>
          <RTTGraph series={rttSeries} maxPoints={60} />
        </div>

        <div className="glass-card p-4 md:p-5 flex flex-col gap-6 justify-center">
          {analysis ? (
            <>
              <OnlineStatusChart online={analysis.online_probability} screenActive={analysis.screen_active_prob} />
              <div className="border-t border-cyber-border pt-4">
                <DeviceCountGauge count={analysis.linked_device_count} />
              </div>
            </>
          ) : (
            <p className="text-xs text-cyber-muted font-mono text-center py-8">
              Select a device and run analysis
            </p>
          )}
        </div>
      </div>

      {/* Analysis details */}
      {analysis && (
        <div className="glass-card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-cyber-text mb-4">Analysis Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Online Probability', value: `${(analysis.online_probability * 100).toFixed(1)}%`, color: 'text-cyber-green' },
              { label: 'Screen Active',      value: `${(analysis.screen_active_prob  * 100).toFixed(1)}%`, color: 'text-cyber-purple' },
              { label: 'Avg RTT',            value: `${analysis.avg_rtt_ms?.toFixed(1)}ms`,               color: 'text-cyber-accent' },
              { label: 'RTT Variance',       value: `${analysis.variance_rtt_ms?.toFixed(1)}`,            color: 'text-cyber-orange' },
            ].map(m => (
              <div key={m.label} className="text-center p-4 rounded-lg bg-white/5 border border-cyber-border">
                <div className={`text-xl font-mono font-bold ${m.color}`}>{m.value}</div>
                <div className="text-xs text-cyber-muted mt-1 font-mono">{m.label}</div>
              </div>
            ))}
          </div>
          {analysis.notes && (
            <div className="p-3 rounded-lg bg-cyber-bg/60 border border-cyber-border">
              <p className="text-xs font-mono text-cyber-muted">{analysis.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="glass-card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-cyber-text mb-4">Analysis History</h3>
          <div className="overflow-x-auto">
            <table className="cyber-table min-w-[680px]">
              <thead>
                <tr><th>Analyzed At</th><th>Online %</th><th>Screen %</th><th>Avg RTT</th><th>Linked</th></tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td className="text-cyber-muted">{new Date(h.analyzed_at).toLocaleString()}</td>
                    <td className="text-cyber-green">{(h.online_probability * 100).toFixed(1)}%</td>
                    <td className="text-cyber-purple">{(h.screen_active_prob * 100).toFixed(1)}%</td>
                    <td className="text-cyber-accent">{h.avg_rtt_ms?.toFixed(1)}ms</td>
                    <td className="text-cyber-text">{h.linked_device_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

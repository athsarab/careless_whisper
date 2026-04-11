import { useEffect, useState } from 'react'
import api from '../services/api'
import { Radio, Send, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

const STATUS_CONFIG = {
  pending:  { label: 'PENDING',  className: 'tag-yellow', icon: Clock },
  received: { label: 'RECEIVED', className: 'tag-green',  icon: CheckCircle },
  timeout:  { label: 'TIMEOUT',  className: 'tag-red',    icon: XCircle },
}

export default function ProbeSender() {
  const [devices, setDevices] = useState([])
  const [probes, setProbes] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, received: 0, timeout: 0 })
  const [form, setForm] = useState({ device_id: '', probe_type: 'silent' })
  const [sending, setSending] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadDevices()
    loadProbes()
    loadStats()
    const socket = io('/', { transports: ['websocket', 'polling'] })
    socket.on('probe:sent', (probe) => {
      setProbes(prev => [probe, ...prev.slice(0, 19)])
      setStats(prev => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }))
    })
    socket.on('receipt:captured', (r) => {
      setProbes(prev => prev.map(p => p.id === r.probe_id ? { ...p, status: 'received' } : p))
    })
    return () => socket.disconnect()
  }, [])

  const loadDevices = async () => {
    const res = await api.get('/devices')
    setDevices(res.data.filter(d => d.consent_verified))
    if (res.data.length > 0) setForm(f => ({ ...f, device_id: res.data[0].id }))
  }

  const loadProbes = async (p = 1) => {
    const res = await api.get(`/probes?page=${p}&per_page=15`)
    setProbes(res.data.probes)
    setTotal(res.data.total)
  }

  const loadStats = async () => {
    const res = await api.get('/probes/stats')
    setStats(res.data)
  }

  const sendProbe = async (e) => {
    e.preventDefault()
    if (!form.device_id) { toast.error('Select a device first'); return }
    setSending(true)
    try {
      await api.post('/probes/send', form)
      toast.success('Probe dispatched')
      loadStats()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send probe')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 page-enter">
      <div>
        <h2 className="text-lg font-semibold text-cyber-text">Probe Sender</h2>
        <p className="text-xs text-cyber-muted font-mono">Dispatch silent probes to authorized test accounts</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-cyber-accent' },
          { label: 'Pending', value: stats.pending, color: 'text-cyber-yellow' },
          { label: 'Received', value: stats.received, color: 'text-cyber-green' },
          { label: 'Timeout', value: stats.timeout, color: 'text-cyber-red' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center border border-cyber-border">
            <div className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-cyber-muted mt-1 font-mono uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send form */}
        <div className="glass-card p-4 md:p-6">
          <h3 className="text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
            <Radio size={14} className="text-cyber-accent" /> Dispatch Probe
          </h3>
          <form onSubmit={sendProbe} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-cyber-muted mb-1.5 block tracking-wider uppercase">Target Device</label>
              <select
                id="probe-device"
                className="cyber-input"
                value={form.device_id}
                onChange={e => setForm(f => ({ ...f, device_id: e.target.value }))}
              >
                {devices.length === 0 && <option value="">No authorized devices</option>}
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.label || d.phone_number}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-cyber-muted mb-1.5 block tracking-wider uppercase">Probe Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['silent', 'delivery', 'read'].map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(f => ({ ...f, probe_type: t }))}
                    className={`py-2 px-2 rounded-lg border text-xs font-mono font-medium transition-all ${
                      form.probe_type === t
                        ? 'border-cyber-accent bg-cyber-accent/15 text-cyber-accent'
                        : 'border-cyber-border text-cyber-muted hover:border-cyber-accent/30'
                    }`}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-cyber-border bg-cyber-bg/50 text-xs font-mono text-cyber-muted space-y-1">
              <div>Type: <span className="text-cyber-accent">{form.probe_type}</span></div>
              <div>Device: <span className="text-cyber-text">{devices.find(d=>d.id===form.device_id)?.label || '—'}</span></div>
              <div>Timestamp: <span className="text-cyber-green">{new Date().toISOString()}</span></div>
            </div>

            <button id="send-probe-btn" type="submit" disabled={sending || devices.length === 0}
              className="btn-cyber w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
              {sending
                ? <><Loader size={13} className="animate-spin" /><span>DISPATCHING...</span></>
                : <><Send size={13} /><span>DISPATCH PROBE</span></>
              }
            </button>
          </form>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-cyber-border space-y-1.5">
            <p className="text-xs font-mono text-cyber-muted mb-2 tracking-widest uppercase">Probe Types</p>
            <div className="text-xs font-mono space-y-1">
              <div><span className="text-cyber-accent">SILENT</span> — No notification triggered</div>
              <div><span className="text-cyber-green">DELIVERY</span> — Standard delivery receipt</div>
              <div><span className="text-cyber-purple">READ</span> — Read receipt request</div>
            </div>
          </div>
        </div>

        {/* Probes table */}
        <div className="lg:col-span-2 glass-card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-cyber-text mb-4">Probe Log</h3>
          <div className="overflow-x-auto">
            <table className="cyber-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Probe ID</th>
                  <th>Type</th>
                  <th>Sent At</th>
                  <th>Status</th>
                  <th>Acks</th>
                </tr>
              </thead>
              <tbody>
                {probes.map(p => {
                  const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending
                  return (
                    <tr key={p.id}>
                      <td className="text-cyber-muted">{p.id.slice(0, 8)}…</td>
                      <td><span className="tag tag-cyan">{p.probe_type}</span></td>
                      <td className="text-cyber-muted">{new Date(p.sent_at).toLocaleTimeString()}</td>
                      <td><span className={`tag ${sc.className}`}>{sc.label}</span></td>
                      <td className="text-cyber-accent">{p.receipt_count ?? 0}</td>
                    </tr>
                  )
                })}
                {probes.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-cyber-muted py-8">No probes sent yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-3 text-xs font-mono text-cyber-muted">
            <span className="break-words">Showing {probes.length} of {total} probes</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => { setPage(p=>p-1); loadProbes(page-1) }}
                className="btn-cyber py-1 px-3 text-xs disabled:opacity-30">PREV</button>
              <button disabled={probes.length < 15} onClick={() => { setPage(p=>p+1); loadProbes(page+1) }}
                className="btn-cyber py-1 px-3 text-xs disabled:opacity-30">NEXT</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import api from '../services/api'
import { Inbox, Filter, ChevronRight } from 'lucide-react'
import { io } from 'socket.io-client'

function RTTBadge({ rtt }) {
  const ms = rtt ?? 0
  const color = ms < 200 ? 'tag-green' : ms < 1000 ? 'tag-yellow' : 'tag-red'
  return <span className={`tag ${color}`}>{ms.toFixed(1)}ms</span>
}

export default function ReceiptCollector() {
  const [receipts, setReceipts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filterProbe, setFilterProbe] = useState('')
  const [loading, setLoading] = useState(true)
  const [liveCount, setLiveCount] = useState(0)

  const load = async (p = 1, probe = '') => {
    setLoading(true)
    try {
      let url = `/receipts?page=${p}&per_page=20`
      if (probe) url += `&probe_id=${probe}`
      const res = await api.get(url)
      setReceipts(res.data.receipts)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const socket = io('/', { transports: ['websocket', 'polling'] })
    socket.on('receipt:captured', (r) => {
      setReceipts(prev => [r, ...prev.slice(0, 19)])
      setLiveCount(c => c + 1)
    })
    return () => socket.disconnect()
  }, [])

  const handleFilter = (e) => {
    e.preventDefault()
    setPage(1)
    load(1, filterProbe.trim())
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-cyber-text">Receipt Collector</h2>
          <p className="text-xs text-cyber-muted font-mono">Delivery acknowledgment timestamps & RTT records</p>
        </div>
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyber-green/30 bg-cyber-green/10 text-xs font-mono text-cyber-green">
              <span className="status-dot online" />
              +{liveCount} live
            </div>
          )}
          <div className="text-xs font-mono text-cyber-muted">Total: <span className="text-cyber-accent">{total}</span></div>
        </div>
      </div>

      {/* Filter bar */}
      <form onSubmit={handleFilter} className="glass-card p-4 flex items-center gap-3">
        <Filter size={14} className="text-cyber-muted flex-shrink-0" />
        <input
          className="cyber-input flex-1"
          placeholder="Filter by Probe ID (paste full UUID)..."
          value={filterProbe}
          onChange={e => setFilterProbe(e.target.value)}
        />
        <button type="submit" className="btn-cyber py-1.5 px-4 flex items-center gap-1.5 text-xs flex-shrink-0">
          <ChevronRight size={12} /> APPLY
        </button>
        {filterProbe && (
          <button type="button" onClick={() => { setFilterProbe(''); load(1, '') }}
            className="btn-danger py-1.5 px-3 text-xs">CLR</button>
        )}
      </form>

      {/* Table */}
      <div className="glass-card p-5">
        <div className="overflow-x-auto">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Probe ID</th>
                <th>Received At</th>
                <th>Ack Source</th>
                <th>RTT</th>
                <th>Sim?</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-cyber-accent/30 border-t-cyber-accent rounded-full animate-spin mx-auto" />
                </td></tr>
              )}
              {!loading && receipts.map(r => (
                <tr key={r.id}>
                  <td className="text-cyber-muted text-xs">{r.id.slice(0, 8)}…</td>
                  <td className="text-cyber-muted text-xs">{r.probe_id.slice(0, 8)}…</td>
                  <td className="text-cyber-text">{new Date(r.received_at).toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 2 })}</td>
                  <td>
                    <span className="tag tag-purple">{r.ack_source}</span>
                  </td>
                  <td><RTTBadge rtt={r.rtt_ms} /></td>
                  <td>
                    {r.raw_payload?.sim
                      ? <span className="tag tag-yellow">SIM</span>
                      : <span className="tag tag-cyan">LIVE</span>}
                  </td>
                </tr>
              ))}
              {!loading && receipts.length === 0 && (
                <tr><td colSpan={6} className="text-center text-cyber-muted py-10 font-mono text-sm">
                  No receipts captured yet. Start the simulator or send probes.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-xs font-mono text-cyber-muted">
          <span>Page {page} · {receipts.length} records shown of {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => { setPage(p=>p-1); load(page-1, filterProbe) }}
              className="btn-cyber py-1 px-3 text-xs disabled:opacity-30">← PREV</button>
            <button disabled={receipts.length < 20} onClick={() => { setPage(p=>p+1); load(page+1, filterProbe) }}
              className="btn-cyber py-1 px-3 text-xs disabled:opacity-30">NEXT →</button>
          </div>
        </div>
      </div>

      {/* RTT color legend */}
      <div className="flex items-center gap-4 text-xs font-mono text-cyber-muted">
        <span>RTT Legend:</span>
        <span className="tag tag-green">&lt;200ms fast</span>
        <span className="tag tag-yellow">200-1000ms medium</span>
        <span className="tag tag-red">&gt;1000ms slow / offline</span>
      </div>
    </div>
  )
}

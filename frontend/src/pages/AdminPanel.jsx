import { useEffect, useState } from 'react'
import api from '../services/api'
import { Shield, Trash2, Download, UserPlus, Smartphone, Users, Play, Square } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto glass-card p-6 glow-cyan">
        {children}
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const { isAdmin } = useAuth()
  const [stats, setStats] = useState({})
  const [devices, setDevices] = useState([])
  const [users, setUsers] = useState([])
  const [simRunning, setSimRunning] = useState(false)
  const [deviceModal, setDeviceModal] = useState(false)
  const [userModal, setUserModal] = useState(false)
  const [deviceForm, setDeviceForm] = useState({ phone_number: '', label: '', consent_verified: false })
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', role: 'researcher' })
  const [exporting, setExporting] = useState('')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [statsRes, devRes, usersRes, simRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/devices'),
        api.get('/admin/users'),
        api.get('/simulator/status'),
      ])
      setStats(statsRes.data)
      setDevices(devRes.data)
      setUsers(usersRes.data)
      setSimRunning(simRes.data.running)
    } catch {
      toast.error('Failed to load admin data')
    }
  }

  const addDevice = async (e) => {
    e.preventDefault()
    try {
      await api.post('/devices', deviceForm)
      toast.success('Device added')
      setDeviceModal(false)
      setDeviceForm({ phone_number: '', label: '', consent_verified: false })
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  const removeDevice = async (id, label) => {
    if (!confirm(`Remove device "${label}"?`)) return
    await api.delete(`/devices/${id}`)
    toast.success('Device removed')
    loadAll()
  }

  const addUser = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/users', userForm)
      toast.success('User created')
      setUserModal(false)
      setUserForm({ username: '', email: '', password: '', role: 'researcher' })
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  const removeUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"?`)) return
    await api.delete(`/admin/users/${id}`)
    toast.success('User deleted')
    loadAll()
  }

  const exportCSV = async () => {
    setExporting('csv')
    const res = await api.get('/admin/export/csv', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sdra_export.csv'
    a.click()
    setExporting('')
  }

  const exportPDF = async () => {
    setExporting('pdf')
    const res = await api.get('/admin/export/pdf', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sdra_report.pdf'
    a.click()
    setExporting('')
  }

  const toggleSim = async () => {
    await api.post(simRunning ? '/simulator/stop' : '/simulator/start')
    setSimRunning(!simRunning)
    toast.success(simRunning ? 'Simulator stopped' : 'Simulator started')
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Shield size={40} className="text-cyber-red mx-auto mb-3" />
          <p className="text-cyber-red font-mono">ADMIN ACCESS REQUIRED</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 page-enter">
      <div>
        <h2 className="text-lg font-semibold text-cyber-text flex items-center gap-2">
          <Shield size={16} className="text-cyber-accent" /> Admin Panel
        </h2>
        <p className="text-xs text-cyber-muted font-mono">System management · Device registry · Export controls</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Users', value: stats.total_users || 0, color: 'text-cyber-purple' },
          { label: 'Devices', value: stats.total_devices || 0, color: 'text-cyber-accent' },
          { label: 'Probes', value: stats.total_probes || 0, color: 'text-cyber-green' },
          { label: 'Receipts', value: stats.total_receipts || 0, color: 'text-cyber-yellow' },
          { label: 'Analyses', value: stats.total_analyses || 0, color: 'text-cyber-orange' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center border border-cyber-border">
            <div className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-cyber-muted font-mono mt-1 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 md:gap-3">
        <button id="add-device-btn" onClick={() => setDeviceModal(true)} className="btn-cyber flex items-center gap-2 text-sm">
          <Smartphone size={14} /> ADD DEVICE
        </button>
        <button id="add-user-btn" onClick={() => setUserModal(true)} className="btn-cyber flex items-center gap-2 text-sm">
          <UserPlus size={14} /> ADD USER
        </button>
        <button id="export-csv-btn" onClick={exportCSV} disabled={exporting === 'csv'} className="btn-green flex items-center gap-2 text-sm">
          <Download size={14} /> {exporting === 'csv' ? 'EXPORTING...' : 'EXPORT CSV'}
        </button>
        <button id="export-pdf-btn" onClick={exportPDF} disabled={exporting === 'pdf'} className="btn-green flex items-center gap-2 text-sm">
          <Download size={14} /> {exporting === 'pdf' ? 'EXPORTING...' : 'EXPORT PDF'}
        </button>
        <button id="admin-toggle-sim" onClick={toggleSim} className={`flex items-center gap-2 text-sm btn-cyber ${simRunning ? 'btn-danger' : 'btn-green'}`}>
          {simRunning ? <><Square size={13} /> STOP SIM</> : <><Play size={13} /> START SIM</>}
        </button>
      </div>

      <div className="glass-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
            <Smartphone size={14} className="text-cyber-accent" /> Test Devices
          </h3>
          <span className="tag tag-cyan">{devices.length} registered</span>
        </div>
        <div className="overflow-x-auto">
          <table className="cyber-table min-w-[700px]">
            <thead>
              <tr><th>Label</th><th>Phone Number</th><th>Consent</th><th>Added</th><th>Action</th></tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td className="text-cyber-text font-medium">{d.label || '-'}</td>
                  <td className="text-cyber-accent">{d.phone_number}</td>
                  <td>{d.consent_verified ? <span className="tag tag-green">VERIFIED</span> : <span className="tag tag-red">PENDING</span>}</td>
                  <td className="text-cyber-muted">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => removeDevice(d.id, d.label || d.phone_number)} className="text-cyber-muted hover:text-cyber-red transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr><td colSpan={5} className="text-center text-cyber-muted py-6 font-mono">No devices registered</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
            <Users size={14} className="text-cyber-accent" /> System Users
          </h3>
          <span className="tag tag-purple">{users.length} accounts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="cyber-table min-w-[700px]">
            <thead>
              <tr><th>Username</th><th>Email</th><th>Role</th><th>Created</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="text-cyber-text font-mono font-medium">{u.username}</td>
                  <td className="text-cyber-muted">{u.email}</td>
                  <td>{u.role === 'admin' ? <span className="tag tag-cyan">ADMIN</span> : <span className="tag tag-purple">RESEARCHER</span>}</td>
                  <td className="text-cyber-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => removeUser(u.id, u.username)} className="text-cyber-muted hover:text-cyber-red transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={deviceModal} onClose={() => setDeviceModal(false)}>
        <h3 className="text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
          <Smartphone size={14} className="text-cyber-accent" /> Register Test Device
        </h3>
        <form onSubmit={addDevice} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-cyber-muted mb-1 block uppercase tracking-wider">Phone Number</label>
            <input className="cyber-input" placeholder="+1234567890" required value={deviceForm.phone_number} onChange={(e) => setDeviceForm((f) => ({ ...f, phone_number: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-mono text-cyber-muted mb-1 block uppercase tracking-wider">Label (optional)</label>
            <input className="cyber-input" placeholder="e.g. Test Device Alpha" value={deviceForm.label} onChange={(e) => setDeviceForm((f) => ({ ...f, label: e.target.value }))} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={deviceForm.consent_verified} onChange={(e) => setDeviceForm((f) => ({ ...f, consent_verified: e.target.checked }))} className="w-4 h-4 accent-cyber-green" />
            <span className="text-xs font-mono text-cyber-text">Consent verified - device owner authorized testing</span>
          </label>
          <div className="flex gap-3">
            <button type="submit" className="btn-cyber flex-1">ADD DEVICE</button>
            <button type="button" onClick={() => setDeviceModal(false)} className="btn-danger flex-1">CANCEL</button>
          </div>
        </form>
      </Modal>

      <Modal open={userModal} onClose={() => setUserModal(false)}>
        <h3 className="text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
          <UserPlus size={14} className="text-cyber-accent" /> Create User Account
        </h3>
        <form onSubmit={addUser} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-cyber-muted mb-1 block uppercase tracking-wider">Username</label>
            <input className="cyber-input" required value={userForm.username} onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-mono text-cyber-muted mb-1 block uppercase tracking-wider">Email</label>
            <input type="email" className="cyber-input" required value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-mono text-cyber-muted mb-1 block uppercase tracking-wider">Password</label>
            <input type="password" className="cyber-input" required value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-mono text-cyber-muted mb-1 block uppercase tracking-wider">Role</label>
            <select className="cyber-input" value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="researcher">Researcher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-cyber flex-1">CREATE USER</button>
            <button type="button" onClick={() => setUserModal(false)} className="btn-danger flex-1">CANCEL</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Access granted')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0D1628 0%, #060B14 100%)' }}>

      {/* Animated grid */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="scanline" style={{ animationDelay: `${i * 0.5}s`, animationDuration: '6s' }} />
        ))}
      </div>

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
        style={{ background: '#00F5FF', filter: 'blur(80px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-5"
        style={{ background: '#8B5CF6', filter: 'blur(80px)' }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-3 sm:mx-4">
        <div className="glass-card p-5 sm:p-8 glow-cyan">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(0,245,255,0.3)' }}>
              <Zap size={28} className="text-cyber-accent" />
            </div>
            <h1 className="text-xl font-bold gradient-text mb-1">SDRA Portal</h1>
            <p className="text-xs font-mono text-cyber-muted tracking-widest uppercase">
              Silent Delivery Receipt Analyzer
            </p>
          </div>

          {/* Research notice */}
          <div className="mb-6 p-3 rounded-lg border border-cyber-yellow/30 bg-cyber-yellow/5">
            <p className="text-xs text-cyber-yellow font-mono text-center leading-relaxed">
              ⚠ AUTHORIZED RESEARCH ACCESS ONLY<br/>
              <span className="text-cyber-muted">Academic cybersecurity research tool</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-cyber-red/30 bg-cyber-red/10 flex items-center gap-2">
              <AlertCircle size={14} className="text-cyber-red flex-shrink-0" />
              <span className="text-xs text-cyber-red font-mono">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-cyber-muted mb-1.5 block tracking-wider uppercase">Username</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
                <input
                  id="username"
                  className="cyber-input pl-9"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-cyber-muted mb-1.5 block tracking-wider uppercase">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="cyber-input pl-9 pr-9"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-accent">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" id="login-btn" disabled={loading}
              className="btn-cyber w-full py-2.5 mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-cyber-accent/30 border-t-cyber-accent rounded-full animate-spin" />
                <span>AUTHENTICATING...</span></>
              ) : (
                <><Zap size={14} /><span>AUTHENTICATE</span></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-cyber-border">
  
          </div>
        </div>
      </div>
    </div>
  )
}

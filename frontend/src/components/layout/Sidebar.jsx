import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Radio, Inbox, BarChart3,
  Shield, Zap, LogOut, X
} from 'lucide-react'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',   section: 'main' },
  { to: '/probes',    icon: Radio,           label: 'Probe Sender', section: 'main' },
  { to: '/receipts',  icon: Inbox,           label: 'Receipts',    section: 'main' },
  { to: '/analysis',  icon: BarChart3,       label: 'RTT Analysis', section: 'main' },
  { to: '/admin',     icon: Shield,          label: 'Admin Panel',  section: 'admin', adminOnly: true },
]

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const compact = collapsed && !mobileOpen

  return (
    <>
      {mobileOpen && (
        <button
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu backdrop"
        />
      )}
      <aside
        className={`fixed md:relative top-0 left-0 flex flex-col h-screen transition-all duration-300 z-40 ${
          collapsed ? 'md:w-16' : 'md:w-60'
        } w-64 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          background: 'linear-gradient(180deg, #0A1628 0%, #060B14 100%)',
          borderRight: '1px solid rgba(26, 41, 66, 0.8)',
        }}
      >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-cyber-border">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(0,245,255,0.4)' }}>
            <Zap size={18} className="text-cyber-accent" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyber-green rounded-full border-2 border-cyber-bg animate-pulse" />
        </div>
        {!compact && (
          <div>
            <div className="text-xs font-mono font-bold text-cyber-accent tracking-widest">SDRA</div>
            <div className="text-xs text-cyber-muted leading-tight">Receipt Analyzer</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-cyber-muted hover:text-cyber-accent transition-colors hidden md:block"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            {collapsed
              ? <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              : <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            }
          </svg>
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto text-cyber-muted hover:text-cyber-accent transition-colors md:hidden"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {!compact && (
          <div className="px-2 pb-2">
            <span className="text-xs font-mono text-cyber-muted tracking-widest uppercase">Navigation</span>
          </div>
        )}
        {navItems.map(({ to, icon: Icon, label, adminOnly }) => {
          if (adminOnly && !isAdmin) return null
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                active
                  ? 'text-cyber-accent bg-cyber-accent/10 border border-cyber-accent/20'
                  : 'text-cyber-muted hover:text-cyber-text hover:bg-white/5'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyber-accent rounded-r-full" />
              )}
              <Icon size={17} className={`flex-shrink-0 ${active ? 'text-cyber-accent' : ''}`} />
              {!compact && (
                <span className="text-sm font-medium">{label}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-cyber-border">
        <div className={`flex items-center gap-2 mb-2 ${compact ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold"
            style={{ background: 'linear-gradient(135deg, #00F5FF22, #8B5CF622)', border: '1px solid rgba(0,245,255,0.3)', color: '#00F5FF' }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          {!compact && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-cyber-text truncate">{user?.username}</div>
              <div className={`text-xs tag mt-0.5 inline-block ${user?.role === 'admin' ? 'tag-cyan' : 'tag-purple'}`}>
                {user?.role}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          title="Logout"
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-cyber-muted hover:text-cyber-red hover:bg-cyber-red/10 transition-all text-sm ${compact ? 'justify-center' : ''}`}
        >
          <LogOut size={15} />
          {!compact && <span>Logout</span>}
        </button>
      </div>
      </aside>
    </>
  )
}

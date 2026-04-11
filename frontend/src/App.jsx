import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProbeSender from './pages/ProbeSender'
import ReceiptCollector from './pages/ReceiptCollector'
import RTTAnalysis from './pages/RTTAnalysis'
import AdminPanel from './pages/AdminPanel'
import { useSocket } from './hooks/useSocket'

const PAGE_META = {
  '/':          { title: 'Dashboard',         subtitle: 'Real-time system overview' },
  '/probes':    { title: 'Probe Sender',       subtitle: 'Dispatch & monitor silent probes' },
  '/receipts':  { title: 'Receipt Collector',  subtitle: 'Delivery acknowledgment log' },
  '/analysis':  { title: 'RTT Analysis',       subtitle: 'Pattern detection & state inference' },
  '/admin':     { title: 'Admin Panel',        subtitle: 'System management & exports' },
}

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { connected } = useSocket()
  const location = useLocation()
  const meta = PAGE_META[location.pathname] || { title: 'SDRA', subtitle: '' }

  return (
    <div className="flex h-screen overflow-hidden relative z-10">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          socketConnected={connected}
          onMenuClick={() => setMobileOpen((v) => !v)}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0D1628',
              color: '#CBD5E0',
              border: '1px solid #1A2942',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
            },
            success: { iconTheme: { primary: '#00FF9C', secondary: '#0D1628' } },
            error:   { iconTheme: { primary: '#FF3366', secondary: '#0D1628' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <RequireAuth>
              <AppLayout>
                <Routes>
                  <Route path="/"         element={<Dashboard />} />
                  <Route path="/probes"   element={<ProbeSender />} />
                  <Route path="/receipts" element={<ReceiptCollector />} />
                  <Route path="/analysis" element={<RTTAnalysis />} />
                  <Route path="/admin"    element={<AdminPanel />} />
                  <Route path="*"         element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            </RequireAuth>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

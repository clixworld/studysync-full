import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { isConnected } from './lib/api'
import BottomNav    from './components/BottomNav'
import Dashboard    from './pages/Dashboard'
import Schedule     from './pages/Schedule'
import Tasks        from './pages/Tasks'
import CanvasPage   from './pages/CanvasPage'
import Connect      from './pages/Connect'
import AuthCallback from './pages/AuthCallback'

function AppShell() {
  const loc = useLocation()
  const noNav = ['/', '/connect', '/auth/callback'].includes(loc.pathname)
  const connected = isConnected()

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/"              element={<Navigate to={connected ? '/dashboard' : '/connect'} replace />} />
        <Route path="/connect"       element={<Connect />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={connected ? <Dashboard /> : <Navigate to="/connect" replace />} />
        <Route path="/schedule"  element={connected ? <Schedule />  : <Navigate to="/connect" replace />} />
        <Route path="/tasks"     element={connected ? <Tasks />     : <Navigate to="/connect" replace />} />
        <Route path="/canvas"    element={connected ? <CanvasPage />: <Navigate to="/connect" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!noNav && connected && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

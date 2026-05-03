import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AppShell from './components/AppShell'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Inbox from './pages/Inbox'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Team from './pages/Team'
import Records from './pages/Records'
import RecordDetail from './pages/RecordDetail'
import Settings from './pages/Settings'
import CustomerForm from './pages/CustomerForm'
import TechnicianForm from './pages/TechnicianForm'
import Login from './pages/Login'
import Signup from './pages/Signup'
import SetPasswordPage from './pages/SetPasswordPage'
import Platform from './pages/Platform'
import { isAuthenticated, getUser } from './lib/auth'
import { useActivityRefresh } from './hooks/useActivityRefresh'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  if (!isAuthenticated()) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const user = getUser()
  if (!user || user.role !== 'superadmin') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  useActivityRefresh()
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/invite" element={<SetPasswordPage />} />

        {/* Protected admin routes */}
        <Route element={<AuthGuard><AppShell /></AuthGuard>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/team" element={<Team />} />
          <Route path="/team/new" element={<TechnicianForm />} />
          <Route path="/records" element={<Records />} />
          <Route path="/records/:id" element={<RecordDetail />} />
          <Route path="/settings" element={<Settings />} />

          {/* Superadmin only */}
          <Route path="/platform" element={<SuperAdminGuard><Platform /></SuperAdminGuard>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

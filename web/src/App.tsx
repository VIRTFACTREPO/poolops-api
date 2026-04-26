import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/team" element={<Team />} />
          <Route path="/team/new" element={<TechnicianForm />} />
          <Route path="/records" element={<Records />} />
          <Route path="/records/:id" element={<RecordDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

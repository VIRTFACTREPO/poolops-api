import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Breadcrumbs from './Breadcrumbs'
import { api } from '../lib/api'
import { getUser, clearAuth } from '../lib/auth'

type BillingStatus = {
  subscription_status: 'trialing' | 'active' | 'past_due' | 'cancelled'
  trial_days_remaining: number | null
  trial_ends_at: string | null
  plan: string
}

export default function AppShell() {
  const navigate = useNavigate()
  const user = getUser()
  const [billing, setBilling] = useState<BillingStatus | null>(null)

  useEffect(() => {
    if (user?.role === 'superadmin') return
    api.get<BillingStatus>('/admin/billing/status')
      .then(setBilling)
      .catch(() => null)
  }, [])

  useEffect(() => {
    if (!billing) return
    const expired = billing.subscription_status === 'trialing' && (billing.trial_days_remaining ?? 1) <= 0
    if (expired || billing.subscription_status === 'cancelled' || billing.subscription_status === 'past_due') {
      navigate('/settings?tab=billing', { replace: true })
    }
  }, [billing, navigate])

  const showTrialBanner =
    billing?.subscription_status === 'trialing' && (billing.trial_days_remaining ?? 99) > 0

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar onLogout={handleLogout} />
      <div style={{ flex: 1, marginLeft: 220, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {showTrialBanner && (
          <div style={{
            background: '#FFFBEB',
            borderBottom: '1px solid #FDE68A',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            color: '#92400E',
          }}>
            <span>
              <strong>Free trial</strong> — {billing!.trial_days_remaining}{' '}
              {billing!.trial_days_remaining === 1 ? 'day' : 'days'} remaining.
            </span>
            <button
              onClick={() => navigate('/settings?tab=billing')}
              style={{ background: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Upgrade now
            </button>
          </div>
        )}
        <Topbar />
        <main style={{ flex: 1, background: '#F5F5F3', padding: 28 }}>
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  )
}

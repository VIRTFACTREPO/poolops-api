import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

type Tab = 'Company' | 'Chemicals' | 'Target ranges' | 'Report branding' | 'Billing'

type BillingStatus = {
  subscription_status: 'trialing' | 'active' | 'past_due' | 'cancelled'
  trial_days_remaining: number | null
  trial_ends_at: string | null
  plan: string
}

export default function Settings() {
  const [searchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab | null) ?? 'Company'
  const [tab, setTab] = useState<Tab>(
    (['Company', 'Chemicals', 'Target ranges', 'Report branding', 'Billing'] as Tab[]).includes(initialTab as Tab)
      ? initialTab as Tab
      : 'Company'
  )

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Settings</h1>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['Company', 'Chemicals', 'Target ranges', 'Report branding', 'Billing'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? '#111827' : '#F9FAFB',
              color: tab === t ? '#FFFFFF' : '#374151',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: 20 }}>
        {tab === 'Company' && <CompanyTab />}
        {tab === 'Chemicals' && <ChemicalsTab />}
        {tab === 'Target ranges' && <TargetsTab />}
        {tab === 'Report branding' && <BrandingTab />}
        {tab === 'Billing' && <BillingTab />}
      </div>
    </div>
  )
}

function CompanyTab() {
  return (
    <Section title='Company'>
      <Field label='Company name' value='Pool Pro NZ' />
      <Field label='Support email' value='ops@poolpronz.co.nz' />
      <Field label='Phone' value='+64 9 123 4567' />
    </Section>
  )
}

function ChemicalsTab() {
  return (
    <Section title='Chemicals'>
      <Field label='Default sanitizer' value='Liquid chlorine' />
      <Field label='Acid type' value='Muriatic acid' />
      <Field label='Auto-low-stock threshold' value='20%' />
    </Section>
  )
}

function TargetsTab() {
  return (
    <Section title='Target ranges'>
      <Field label='pH target' value='7.2 – 7.6' />
      <Field label='Free chlorine target' value='1.0 – 3.0 ppm' />
      <Field label='LSI target' value='-0.5 – +0.5' />
    </Section>
  )
}

function BrandingTab() {
  return (
    <Section title='Report branding'>
      <Field label='Primary colour' value='#0F172A' />
      <Field label='Logo on PDF' value='Enabled' />
      <Field label='Footer note' value='Thanks for trusting PoolOps' />
    </Section>
  )
}

function BillingTab() {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    api.get<BillingStatus>('/admin/billing/status')
      .then(setStatus)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async () => {
    setActionLoading(true)
    try {
      const { url } = await api.post<{ url: string }>('/admin/billing/checkout')
      window.location.href = url
    } catch (e: any) {
      alert(e.message || 'Could not start checkout. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleManage = async () => {
    setActionLoading(true)
    try {
      const { url } = await api.post<{ url: string }>('/admin/billing/portal')
      window.open(url, '_blank')
    } catch (e: any) {
      alert(e.message || 'Could not open billing portal. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div style={{ color: '#9CA3AF', fontSize: 13 }}>Loading billing info…</div>

  if (!status) return (
    <Section title='Billing'>
      <div style={{ fontSize: 13, color: '#6B7280' }}>Billing info unavailable. Please refresh.</div>
    </Section>
  )

  const isTrialing = status.subscription_status === 'trialing'
  const isActive = status.subscription_status === 'active'
  const isPastDue = status.subscription_status === 'past_due'
  const isCancelled = status.subscription_status === 'cancelled'
  const trialExpired = isTrialing && (status.trial_days_remaining ?? 1) <= 0

  return (
    <Section title='Billing'>
      {/* Status banner */}
      {isTrialing && !trialExpired && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: '3px solid #F59E0B', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
            Free trial — {status.trial_days_remaining} {status.trial_days_remaining === 1 ? 'day' : 'days'} remaining
          </div>
          <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
            After your trial ends, you'll need an active subscription to continue.
          </div>
        </div>
      )}

      {trialExpired && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderLeft: '3px solid #EF4444', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>Trial expired</div>
          <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>Subscribe to restore access.</div>
        </div>
      )}

      {isPastDue && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderLeft: '3px solid #EF4444', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>Payment failed</div>
          <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>Please update your payment method to avoid interruption.</div>
        </div>
      )}

      {isCancelled && (
        <div style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Subscription cancelled</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Resubscribe to regain access.</div>
        </div>
      )}

      {/* Fields */}
      <Field label='Plan' value={status.plan.charAt(0).toUpperCase() + status.plan.slice(1)} />
      <Field
        label='Status'
        value={isActive ? 'Active' : isTrialing ? (trialExpired ? 'Trial expired' : 'Free trial') : isPastDue ? 'Past due' : 'Cancelled'}
      />
      {isTrialing && status.trial_ends_at && (
        <Field
          label='Trial ends'
          value={new Date(status.trial_ends_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
        />
      )}

      {/* Actions */}
      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {(isTrialing || isCancelled || trialExpired) && (
          <button onClick={handleUpgrade} disabled={actionLoading} style={primaryBtn}>
            {actionLoading ? 'Loading…' : 'Upgrade now'}
          </button>
        )}
        {(isActive || isPastDue) && (
          <button onClick={handleManage} disabled={actionLoading} style={secondaryBtn}>
            {actionLoading ? 'Loading…' : 'Manage billing'}
          </button>
        )}
      </div>
    </Section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#9CA3AF', fontWeight: 700, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

const primaryBtn: React.CSSProperties = { background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const secondaryBtn: React.CSSProperties = { background: '#F9FAFB', color: '#111827', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }

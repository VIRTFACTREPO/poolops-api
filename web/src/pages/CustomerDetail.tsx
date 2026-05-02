import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { colors, radii, spacing, typography, shadows } from '../theme/tokens'

type Tab = 'Overview' | 'Pool' | 'Service History' | 'Billing'

type ServicePlan = {
  id: string
  frequency: string
  day_of_week: number | null
  active: boolean
  technician: { full_name: string } | null
}

type Pool = {
  id: string
  volume_litres: number
  pool_type: string
  surface_type: string | null
  equipment_notes: string | null
  gate_access: string | null
  warnings: string | null
  service_plans: ServicePlan[]
}

type Customer = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  address: string
  active: boolean
  created_at: string
  pools: Pool[]
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('Overview')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.get<Customer>(`/admin/customers/${id}`)
      .then(setCustomer)
      .catch((err) => setError(err.message || 'Failed to load customer'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div style={{ color: colors.textMuted, fontSize: typography.sizes.body, padding: spacing.lg }}>Loading…</div>
  }
  if (error || !customer) {
    return <div style={{ color: colors.red, fontSize: typography.sizes.body, padding: spacing.lg }}>{error || 'Customer not found'}</div>
  }

  const pool = customer.pools?.[0]
  const plan = pool?.service_plans?.find((p) => p.active) ?? pool?.service_plans?.[0]
  const techName = plan?.technician?.full_name ?? '—'
  const dayLabel = plan?.day_of_week != null ? DAYS[plan.day_of_week] : '—'
  const freqLabel = plan ? capitalize(plan.frequency) : '—'
  const initials = `${customer.first_name[0] ?? ''}${customer.last_name[0] ?? ''}`.toUpperCase()
  const fullName = `${customer.last_name}, ${customer.first_name}`
  const memberSince = new Date(customer.created_at).toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <div style={{
            width: 48, height: 48, borderRadius: radii.standard,
            background: colors.poolBluLight, border: `1px solid ${colors.border}`,
            display: 'grid', placeItems: 'center',
            color: colors.poolBlue, fontWeight: typography.weights.bold, fontSize: 16,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: typography.sizes.h2, fontWeight: typography.weights.bold, color: colors.textHeading }}>{fullName}</div>
            <div style={{ fontSize: typography.sizes.small, color: colors.textSecondary, marginTop: 3 }}>
              {customer.address} · {freqLabel} · {techName}
            </div>
          </div>
          <span style={{
            fontSize: typography.sizes.label, fontWeight: typography.weights.semibold,
            borderRadius: radii.pill, padding: '3px 9px',
            background: customer.active ? colors.greenBg : colors.surface2,
            color: customer.active ? colors.greenText : colors.textMuted,
          }}>
            {customer.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: spacing.lg }}>
        {(['Overview', 'Pool', 'Service History', 'Billing'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 16px',
              fontSize: typography.sizes.small,
              fontWeight: typography.weights.medium,
              color: tab === t ? colors.poolBlue : colors.textSecondary,
              border: 'none',
              borderBottom: tab === t ? `2px solid ${colors.poolBlue}` : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
          <Card title='Contact'>
            <Row k='Email' v={customer.email} />
            <Row k='Phone' v={customer.phone || '—'} />
            <Row k='Address' v={customer.address} />
            <Row k='Service plan' v={plan ? `${freqLabel} — ${dayLabel}s` : '—'} />
            <Row k='Assigned tech' v={techName} />
            <Row k='Customer since' v={memberSince} />
          </Card>
          {pool ? (
            <Card title='Pool summary'>
              <Row k='Volume' v={`${pool.volume_litres.toLocaleString()} L`} />
              <Row k='Type' v={capitalize(pool.pool_type)} />
              {pool.surface_type && <Row k='Surface' v={capitalize(pool.surface_type)} />}
              {pool.equipment_notes && <Row k='Equipment' v={pool.equipment_notes} />}
              {pool.gate_access && <Row k='Access' v={pool.gate_access} />}
              {pool.warnings && <Row k='Notes' v={pool.warnings} warn />}
            </Card>
          ) : (
            <Card title='Pool summary'>
              <div style={{ fontSize: typography.sizes.small, color: colors.textMuted, padding: `${spacing.sm}px 0` }}>No pool on record</div>
            </Card>
          )}
        </div>
      )}

      {tab === 'Pool' && (
        pool ? (
          <Card title='Pool'>
            <Row k='Volume' v={`${pool.volume_litres.toLocaleString()} L`} />
            <Row k='Type' v={capitalize(pool.pool_type)} />
            {pool.surface_type && <Row k='Surface' v={capitalize(pool.surface_type)} />}
            {pool.equipment_notes && <Row k='Equipment' v={pool.equipment_notes} />}
            {pool.gate_access && <Row k='Gate access' v={pool.gate_access} />}
            {pool.warnings && <Row k='Site notes' v={pool.warnings} warn />}
          </Card>
        ) : (
          <Card title='Pool'><div style={{ fontSize: typography.sizes.small, color: colors.textMuted }}>No pool on record</div></Card>
        )
      )}

      {tab === 'Service History' && (
        <Card title='Service history'>
          <div style={{ fontSize: typography.sizes.small, color: colors.textMuted, padding: `${spacing.sm}px 0` }}>No service records yet</div>
        </Card>
      )}

      {tab === 'Billing' && (
        <Card title='Billing'>
          <div style={{ fontSize: typography.sizes.small, color: colors.textMuted, padding: `${spacing.sm}px 0` }}>Billing not yet configured for this customer</div>
        </Card>
      )}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.border}`, borderRadius: radii.standard, padding: spacing.md, boxShadow: shadows.card }}>
      <div style={{ fontSize: typography.sizes.label, fontWeight: typography.weights.semibold, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted, marginBottom: spacing.sm }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${colors.border}` }}>
      <span style={{ fontSize: typography.sizes.small, color: colors.textSecondary }}>{k}</span>
      <span style={{ fontSize: typography.sizes.small, fontWeight: typography.weights.medium, color: warn ? colors.amberText : colors.textBody }}>{v}</span>
    </div>
  )
}

function capitalize(v: string) {
  return v ? v[0].toUpperCase() + v.slice(1) : v
}

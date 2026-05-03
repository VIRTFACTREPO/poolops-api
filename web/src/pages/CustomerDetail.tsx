import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
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
  company_id: string
  customer_number: number | null
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
  const [addingPool, setAddingPool] = useState(false)
  const [savingPool, setSavingPool] = useState(false)
  const [poolForm, setPoolForm] = useState({ volume_litres: '', pool_type: 'salt', gate_access: '', warnings: '' })

  const loadCustomer = () => {
    if (!id) return
    setLoading(true)
    api.get<Customer>(`/admin/customers/${id}`)
      .then(setCustomer)
      .catch((err) => setError(err.message || 'Failed to load customer'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCustomer()
  }, [id])

  if (loading) {
    return <div style={{ color: colors.textMuted, fontSize: typography.sizes.body, padding: spacing.lg }}>Loading…</div>
  }
  if (error || !customer) {
    return <div style={{ color: colors.red, fontSize: typography.sizes.body, padding: spacing.lg }}>{error || 'Customer not found'}</div>
  }

  const pool = customer.pools?.[0]

  const formatVolume = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    return digits ? Number(digits).toLocaleString() : ''
  }

  const handleAddPool = async () => {
    if (!poolForm.volume_litres.trim()) {
      setError('Volume is required')
      return
    }
    const volume = Number(poolForm.volume_litres.replace(/,/g, ''))
    if (!Number.isFinite(volume) || volume <= 0) {
      setError('Volume must be a positive number')
      return
    }

    setSavingPool(true)
    setError(null)
    try {
      const { error: insertErr } = await supabase.from('pools').insert({
        customer_id: customer.id,
        company_id: customer.company_id,
        volume_litres: volume,
        pool_type: poolForm.pool_type,
        gate_access: poolForm.gate_access || null,
        warnings: poolForm.warnings || null,
      })
      if (insertErr) throw insertErr

      setAddingPool(false)
      setPoolForm({ volume_litres: '', pool_type: 'salt', gate_access: '', warnings: '' })
      loadCustomer()
    } catch (err: any) {
      setError(err.message || 'Failed to add pool')
    } finally {
      setSavingPool(false)
    }
  }
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: typography.sizes.h2, fontWeight: typography.weights.bold, color: colors.textHeading }}>{fullName}</div>
              {customer.customer_number != null && (
                <span style={{ fontSize: typography.sizes.label, color: colors.textMuted, fontWeight: typography.weights.medium }}>
                  #{customer.customer_number}
                </span>
              )}
            </div>
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
        <Card
          title='Pools'
          right={
            <button
              onClick={() => setAddingPool((v) => !v)}
              style={{
                background: colors.ink,
                color: colors.white,
                border: 'none',
                borderRadius: radii.pill,
                padding: '6px 12px',
                fontSize: typography.sizes.small,
                cursor: 'pointer',
              }}
            >
              Add pool
            </button>
          }
        >
          {addingPool && (
            <div style={{ display: 'grid', gap: spacing.sm, marginBottom: spacing.md, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radii.md, padding: spacing.sm }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
                <input
                  style={field}
                  placeholder='Volume (litres)'
                  type='text'
                  inputMode='numeric'
                  value={poolForm.volume_litres}
                  onChange={(e) => setPoolForm((prev) => ({ ...prev, volume_litres: formatVolume(e.target.value) }))}
                />
                <select style={field as React.CSSProperties} value={poolForm.pool_type} onChange={(e) => setPoolForm((prev) => ({ ...prev, pool_type: e.target.value }))}>
                  <option value='salt'>Salt</option>
                  <option value='chlorine'>Chlorine</option>
                  <option value='mineral'>Mineral</option>
                  <option value='freshwater'>Freshwater</option>
                  <option value='spa'>Spa Pool</option>
                </select>
              </div>
              <input style={field} placeholder='Gate code' value={poolForm.gate_access} onChange={(e) => setPoolForm((prev) => ({ ...prev, gate_access: e.target.value }))} />
              <input style={field} placeholder='Site notes' value={poolForm.warnings} onChange={(e) => setPoolForm((prev) => ({ ...prev, warnings: e.target.value }))} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.sm }}>
                <button onClick={() => setAddingPool(false)} style={{ background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: radii.md, padding: '8px 12px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleAddPool} disabled={savingPool} style={{ background: colors.ink, color: colors.white, border: 'none', borderRadius: radii.md, padding: '8px 12px', cursor: savingPool ? 'not-allowed' : 'pointer' }}>{savingPool ? 'Saving…' : 'Save pool'}</button>
              </div>
            </div>
          )}

          {customer.pools?.length ? customer.pools.map((p) => (
            <div key={p.id} style={{ marginBottom: spacing.sm }}>
              <Row k='Volume' v={`${p.volume_litres.toLocaleString()} L`} />
              <Row k='Type' v={capitalize(p.pool_type)} />
              {p.surface_type && <Row k='Surface' v={capitalize(p.surface_type)} />}
              {p.equipment_notes && <Row k='Equipment' v={p.equipment_notes} />}
              {p.gate_access && <Row k='Gate access' v={p.gate_access} />}
              {p.warnings && <Row k='Site notes' v={p.warnings} warn />}
            </div>
          )) : (
            <div style={{ fontSize: typography.sizes.small, color: colors.textMuted }}>No pool on record</div>
          )}
        </Card>
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

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.border}`, borderRadius: radii.standard, padding: spacing.md, boxShadow: shadows.card }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <div style={{ fontSize: typography.sizes.label, fontWeight: typography.weights.semibold, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted }}>{title}</div>
        {right}
      </div>
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

const field: React.CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  padding: `10px ${spacing.md}px`,
  color: colors.ink,
  fontSize: typography.sizes.body,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

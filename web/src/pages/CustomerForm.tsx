import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { colors, radii, spacing, typography } from '../theme/tokens'

type PoolCategory = 'pool' | 'spa'
type PoolEntry = { category: PoolCategory; pool_type: string; volume_litres: string; gate_access: string; warnings: string }

export default function CustomerForm() {
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [pools, setPools] = useState<PoolEntry[]>([{ category: 'pool', pool_type: 'salt', volume_litres: '', gate_access: '', warnings: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updatePool = (i: number, field: keyof PoolEntry, value: string) =>
    setPools(prev => prev.map((p, idx) => {
      if (idx !== i) return p
      if (field === 'category') {
        return { ...p, category: value as PoolCategory, pool_type: value === 'spa' ? 'spa' : 'salt' }
      }
      return { ...p, [field]: value }
    }))

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !address.trim() || pools.some(p => !p.volume_litres)) {
      setError('Please fill in all required fields')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: company } = await supabase.from('companies').select('id').limit(1).single()
      if (!company) throw new Error('No company found')

      const { data: customer, error: custErr } = await supabase
        .from('customers')
        .insert({ first_name: firstName, last_name: lastName, email, phone: phone || null, address, company_id: company.id })
        .select('id')
        .single()
      if (custErr) throw custErr

      for (const pool of pools) {
        const { error: poolErr } = await supabase.from('pools').insert({
          customer_id: customer.id,
          company_id: company.id,
          volume_litres: Number(pool.volume_litres),
          pool_type: pool.pool_type,
          gate_access: pool.gate_access || null,
          warnings: pool.warnings || null,
        })
        if (poolErr) throw poolErr
      }

      navigate('/customers')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 0, maxWidth: 560 }}>
      <h1 style={{ fontSize: typography.sizes.h2, fontWeight: typography.weights.bold, color: colors.textHeading, letterSpacing: -0.3, margin: 0, marginBottom: spacing.lg }}>
        New Customer
      </h1>

      <div style={{ background: colors.white, border: `1px solid ${colors.border}`, borderRadius: radii.standard, overflow: 'hidden' }}>
        <Section title='Contact' first>
          <Fields>
            <Row>
              <input style={field} placeholder='First name' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <input style={field} placeholder='Last name' value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Row>
            <input style={field} placeholder='Email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={field} placeholder='Phone (optional)' value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input style={field} placeholder='Address' value={address} onChange={(e) => setAddress(e.target.value)} />
          </Fields>
        </Section>

        <Section title='Pool'>
          <Fields>
            {pools.map((pool, i) => (
              <div key={i} style={{ position: 'relative', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radii.md, padding: spacing.md }}>
                {pools.length > 1 && (
                  <button
                    onClick={() => setPools(prev => prev.filter((_, idx) => idx !== i))}
                    style={{
                      position: 'absolute',
                      top: spacing.sm,
                      right: spacing.sm,
                      background: 'transparent',
                      border: 'none',
                      color: colors.textMuted,
                      cursor: 'pointer',
                      fontSize: 16,
                      lineHeight: 1,
                      padding: '0 4px',
                    }}
                  >
                    ×
                  </button>
                )}
                <div style={{ display: 'grid', gap: spacing.sm }}>
                  {/* Pool / Spa toggle */}
                  <div style={{ display: 'flex', gap: 4, background: colors.surface2 || colors.surface, border: `1px solid ${colors.border}`, borderRadius: radii.md, padding: 3 }}>
                    {(['pool', 'spa'] as PoolCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type='button'
                        onClick={() => updatePool(i, 'category', cat)}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          borderRadius: radii.md,
                          border: 'none',
                          fontSize: typography.sizes.small,
                          fontWeight: typography.weights.semibold,
                          cursor: 'pointer',
                          background: pool.category === cat ? colors.white : 'transparent',
                          color: pool.category === cat ? colors.ink : colors.textMuted,
                          boxShadow: pool.category === cat ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s',
                        }}
                      >
                        {cat === 'pool' ? 'Pool' : 'Spa Pool'}
                      </button>
                    ))}
                  </div>
                  <Row>
                    <input style={field} placeholder='Volume (litres)' value={pool.volume_litres} onChange={(e) => updatePool(i, 'volume_litres', e.target.value)} type='number' min='1' />
                    {pool.category === 'pool' ? (
                      <select style={field as React.CSSProperties} value={pool.pool_type} onChange={(e) => updatePool(i, 'pool_type', e.target.value)}>
                        <option value='salt'>Salt</option>
                        <option value='chlorine'>Chlorine</option>
                        <option value='mineral'>Mineral</option>
                        <option value='freshwater'>Freshwater</option>
                      </select>
                    ) : (
                      <div style={{ ...field, color: colors.textMuted, display: 'flex', alignItems: 'center' }}>Spa Pool</div>
                    )}
                  </Row>
                  <input style={field} placeholder='Gate code / lockbox' value={pool.gate_access} onChange={(e) => updatePool(i, 'gate_access', e.target.value)} />
                  <input style={field} placeholder='Site notes (pets, alarms, etc.)' value={pool.warnings} onChange={(e) => updatePool(i, 'warnings', e.target.value)} />
                </div>
              </div>
            ))}
            <button
              onClick={() => setPools(prev => [...prev, { category: 'pool', pool_type: 'salt', volume_litres: '', gate_access: '', warnings: '' }])}
              style={{
                background: 'transparent',
                border: `1px dashed ${colors.border}`,
                borderRadius: radii.md,
                color: colors.textMuted,
                padding: `${spacing.sm}px ${spacing.md}px`,
                fontSize: typography.sizes.body,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              + Add another pool
            </button>
          </Fields>
        </Section>

        <Section title='Service plan'>
          <Fields>
            <Row>
              <select style={field as React.CSSProperties} defaultValue='fortnightly'>
                <option value='weekly'>Weekly</option>
                <option value='fortnightly'>Fortnightly</option>
                <option value='monthly'>Monthly</option>
              </select>
              <select style={field as React.CSSProperties} defaultValue='Monday'>
                <option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option>
              </select>
            </Row>
          </Fields>
        </Section>
      </div>

      <div style={{
        marginTop: spacing.md,
        background: colors.amberBg,
        border: `1px solid ${colors.amberBorder}`,
        borderLeft: `3px solid ${colors.amber}`,
        color: colors.amberText,
        borderRadius: radii.lg,
        padding: `${spacing.sm}px ${spacing.md}px`,
        fontSize: typography.sizes.small,
        lineHeight: 1.5,
      }}>
        ⚠ Owner invite will be sent once saved. Please verify contact details and service frequency.
      </div>

      {error && (
        <div style={{ marginTop: spacing.sm, fontSize: typography.sizes.small, color: colors.red, background: colors.redBg, border: `1px solid ${colors.redBorder}`, borderRadius: radii.md, padding: `${spacing.sm}px ${spacing.md}px` }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          marginTop: spacing.md,
          background: loading ? colors.textMuted : colors.ink,
          color: colors.white,
          border: 'none',
          borderRadius: radii.pill,
          padding: `${spacing.md}px`,
          fontSize: typography.sizes.body,
          fontWeight: typography.weights.bold,
          cursor: loading ? 'not-allowed' : 'pointer',
          minHeight: 52,
          letterSpacing: -0.2,
        }}
      >
        {loading ? 'Saving…' : 'Save & invite owner'}
      </button>
    </div>
  )
}

function Section({ title, children, first = false }: { title: string; children: React.ReactNode; first?: boolean }) {
  return (
    <div style={{
      padding: spacing.md,
      borderTop: first ? 'none' : `1px solid ${colors.border}`,
    }}>
      <div style={{
        fontSize: typography.sizes.label,
        fontWeight: typography.weights.bold,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Fields({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gap: spacing.sm }}>{children}</div>
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>{children}</div>
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

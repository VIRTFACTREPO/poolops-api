import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { colors, radii, spacing, typography } from '../theme/tokens'

type PoolType = 'salt' | 'chlorine' | 'mineral' | 'freshwater'

export default function CustomerForm() {
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [volumeLitres, setVolumeLitres] = useState('')
  const [poolType, setPoolType] = useState<PoolType>('salt')
  const [gateAccess, setGateAccess] = useState('')
  const [siteNotes, setSiteNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !address.trim() || !volumeLitres) {
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

      const { error: poolErr } = await supabase
        .from('pools')
        .insert({ customer_id: customer.id, company_id: company.id, volume_litres: Number(volumeLitres), pool_type: poolType, gate_access: gateAccess || null, warnings: siteNotes || null })
      if (poolErr) throw poolErr

      navigate('/customers')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: spacing.md }}>
      <h1 style={{ fontSize: typography.sizes.h2, fontWeight: typography.weights.bold, color: colors.textHeading, letterSpacing: -0.3, margin: 0 }}>
        New Customer
      </h1>

      <Section title='1) Contact'>
        <Fields>
          <Row>
            <input style={field} placeholder='First name' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input style={field} placeholder='Last name' value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Row>
          <input style={field} placeholder='Email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={field} placeholder='Phone (optional)' value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Fields>
      </Section>

      <Section title='2) Pool'>
        <Fields>
          <input style={field} placeholder='Address' value={address} onChange={(e) => setAddress(e.target.value)} />
          <Row>
            <input style={field} placeholder='Volume (litres)' value={volumeLitres} onChange={(e) => setVolumeLitres(e.target.value)} type='number' min='1' />
            <select style={field as React.CSSProperties} value={poolType} onChange={(e) => setPoolType(e.target.value as PoolType)}>
              <option value='salt'>Salt</option>
              <option value='chlorine'>Chlorine</option>
              <option value='mineral'>Mineral</option>
              <option value='freshwater'>Freshwater</option>
            </select>
          </Row>
        </Fields>
      </Section>

      <Section title='3) Access'>
        <Fields>
          <input style={field} placeholder='Gate code / lockbox' value={gateAccess} onChange={(e) => setGateAccess(e.target.value)} />
          <input style={field} placeholder='Site notes (pets, alarms, etc.)' value={siteNotes} onChange={(e) => setSiteNotes(e.target.value)} />
        </Fields>
      </Section>

      <Section title='4) Service plan'>
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

      <div style={{
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
        <div style={{ fontSize: typography.sizes.small, color: colors.red, background: colors.redBg, border: `1px solid ${colors.redBorder}`, borderRadius: radii.md, padding: `${spacing.sm}px ${spacing.md}px` }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: colors.darkCard,
      border: `1px solid ${colors.darkBorder}`,
      borderRadius: radii.standard,
      padding: spacing.md,
    }}>
      <div style={{
        fontSize: typography.sizes.label,
        fontWeight: typography.weights.bold,
        color: colors.textSecondary,
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
  border: `1px solid ${colors.darkBorder}`,
  borderRadius: radii.md,
  padding: `10px ${spacing.md}px`,
  color: colors.ink,
  fontSize: typography.sizes.body,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Company = {
  id: string
  name: string
  email: string
  plan: string
  subscription_status: 'trialing' | 'active' | 'past_due' | 'cancelled'
  trial_started_at: string | null
  trial_ends_at: string | null
  stripe_subscription_id: string | null
  created_at: string
}

function daysLeft(ends: string | null): number | null {
  if (!ends) return null
  return Math.ceil((new Date(ends).getTime() - Date.now()) / 86400000)
}

function StatusPill({ status, trialEndsAt }: { status: Company['subscription_status']; trialEndsAt: string | null }) {
  const days = status === 'trialing' ? daysLeft(trialEndsAt) : null

  const map = {
    active: { label: 'Active', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
    trialing: days !== null && days <= 0
      ? { label: 'Expired', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' }
      : { label: days !== null ? `Trial · ${days}d` : 'Trial', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    past_due: { label: 'Past due', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
    cancelled: { label: 'Cancelled', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
  }
  const s = map[status]
  return (
    <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  )
}

export default function Platform() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    api.get<Company[]>('/superadmin/companies')
      .then(setCompanies)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = companies.filter(c =>
    !q || `${c.name} ${c.email}`.toLowerCase().includes(q.toLowerCase())
  )

  const counts = {
    total: companies.length,
    active: companies.filter(c => c.subscription_status === 'active').length,
    trialing: companies.filter(c => c.subscription_status === 'trialing').length,
    issues: companies.filter(c => ['past_due', 'cancelled'].includes(c.subscription_status)).length,
  }

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Platform</div>
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>All PoolOps subscribers</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total companies', value: counts.total },
          { label: 'Active paid', value: counts.active, color: '#16A34A' },
          { label: 'On trial', value: counts.trialing, color: '#D97706' },
          { label: 'Need attention', value: counts.issues, color: counts.issues > 0 ? '#DC2626' : '#6B7280' },
        ].map(s => (
          <div key={s.label} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color ?? '#111827' }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search companies..."
          style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#111827', width: 280, outline: 'none' }}
        />
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#EF4444', fontSize: 13 }}>{error}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Company', 'Email', 'Plan', 'Status', 'Signed up'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No companies found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ ...td, fontWeight: 600, color: '#111827' }}>{c.name}</td>
                  <td style={td}>{c.email}</td>
                  <td style={td}><span style={{ fontSize: 12, textTransform: 'capitalize' }}>{c.plan}</span></td>
                  <td style={td}><StatusPill status={c.subscription_status} trialEndsAt={c.trial_ends_at} /></td>
                  <td style={td}>{new Date(c.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const th: React.CSSProperties = { padding: '11px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }
const td: React.CSSProperties = { padding: '13px 16px', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }

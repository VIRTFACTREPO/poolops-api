import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Plan = 'Weekly' | 'Fortnightly' | 'Monthly' | 'Inactive'

type Row = {
  id: string
  status: 'good' | 'warning' | 'inactive'
  name: string
  location: string
  plan: Plan
  lastService: string
  technician: string
}

const rows: Row[] = [
  { id: 'smith-david', status: 'good', name: 'Smith, David', location: 'Remuera', plan: 'Weekly', lastService: 'Today · James T.', technician: 'James T.' },
  { id: 'williams-sarah', status: 'good', name: 'Williams, Sarah', location: 'Ponsonby', plan: 'Fortnightly', lastService: '5 days ago · James T.', technician: 'James T.' },
  { id: 'chen-michael', status: 'warning', name: 'Chen, Michael', location: 'Mt Eden', plan: 'Weekly', lastService: 'Today · Mike R. · LSI flag', technician: 'Mike R.' },
  { id: 'johnson-anne', status: 'good', name: 'Johnson, Anne', location: 'Epsom', plan: 'Monthly', lastService: '24 Mar · Sarah K.', technician: 'Sarah K.' },
  { id: 'peters-sarah', status: 'good', name: 'Peters, Sarah', location: 'Ponsonby', plan: 'Weekly', lastService: '7 days ago · James T.', technician: 'James T.' },
  { id: 'wong-helen', status: 'good', name: 'Wong, Helen', location: 'Herne Bay', plan: 'Weekly', lastService: '7 days ago · James T.', technician: 'James T.' },
  { id: 'taylor-mark', status: 'inactive', name: 'Taylor, Mark', location: 'Grafton', plan: 'Inactive', lastService: '42 days ago', technician: '—' },
]

export default function Customers() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [plan, setPlan] = useState<'All plans' | Plan>('All plans')
  const [tech, setTech] = useState<'All technicians' | string>('All technicians')

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (q && !`${r.name} ${r.location}`.toLowerCase().includes(q.toLowerCase())) return false
      if (plan !== 'All plans' && r.plan !== plan) return false
      if (tech !== 'All technicians' && r.technician !== tech) return false
      return true
    })
  }, [q, plan, tech])

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Customers</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', minWidth: 220, maxWidth: 320, flex: 1 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search customers...'
            style={{
              width: '100%',
              background: '#F9FAFB',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              color: '#111827',
            }}
          />
        </div>

        <select value={plan} onChange={(e) => setPlan(e.target.value as 'All plans' | Plan)} style={selectStyle}>
          <option>All plans</option>
          <option>Weekly</option>
          <option>Fortnightly</option>
          <option>Monthly</option>
          <option>Inactive</option>
        </select>

        <select value={tech} onChange={(e) => setTech(e.target.value)} style={selectStyle}>
          <option>All technicians</option>
          <option>James T.</option>
          <option>Mike R.</option>
          <option>Sarah K.</option>
        </select>

        <button
          onClick={() => navigate('/customers/new')}
          style={{ background: '#111827', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#F9FAFB', cursor: 'pointer', marginLeft: 'auto' }}
        >
          + Add customer
        </button>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Status', 'Name', 'Location', 'Plan', 'Last service', 'Technician', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '11px 16px',
                    textAlign: 'left',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: '#64748B',
                    background: '#F9FAFB',
                    borderBottom: '1px solid #E5E7EB',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} onClick={() => navigate(`/customers/${r.id}`)} style={{ cursor: 'pointer' }}>
                <td style={td}><StatusDot status={r.status} /></td>
                <td style={{ ...td, color: '#111827', fontWeight: 600 }}>{r.name}</td>
                <td style={td}>{r.location}</td>
                <td style={td}><PlanPill plan={r.plan} /></td>
                <td style={td}>{r.lastService}</td>
                <td style={td}>{r.technician}</td>
                <td style={td}>›</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: Row['status'] }) {
  const color = status === 'good' ? '#22C55E' : status === 'warning' ? '#F59E0B' : '#EF4444'
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color }} />
}

function PlanPill({ plan }: { plan: Plan }) {
  const style =
    plan === 'Inactive'
      ? { background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }
      : { background: '#E0F2FE', color: '#0284C7' }
  return <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 20, padding: '3px 9px', ...style }}>{plan}</span>
}

const td: React.CSSProperties = {
  padding: '13px 16px',
  fontSize: 13,
  color: '#6B7280',
  borderBottom: '1px solid #F3F4F6',
}

const selectStyle: React.CSSProperties = {
  background: '#F9FAFB',
  border: '1px solid #D1D5DB',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12,
  color: '#374151',
}

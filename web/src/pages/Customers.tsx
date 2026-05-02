import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'custom'

type Row = {
  id: string
  status: 'good' | 'warning' | 'inactive'
  name: string
  location: string
  plan: string
  lastService: string
  technician: string
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'
}

function suburb(address: string) {
  const parts = address.split(',')
  return parts.length > 1 ? parts[parts.length - 1].trim() : address
}

function daysAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

export default function Customers() {
  const navigate = useNavigate()
  const location = useLocation()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [planFilter, setPlanFilter] = useState('All plans')
  const [techFilter, setTechFilter] = useState('All technicians')
  const [techNames, setTechNames] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: customers, error } = await supabase
        .from('customers')
        .select(`
          id, first_name, last_name, address, active,
          pools(id, service_plans(frequency, technician_id))
        `)
        .order('last_name')

      if (error || !customers) { setLoading(false); return }

      // Collect unique technician IDs
      const techIds = [...new Set(
        customers.flatMap((c: any) =>
          (c.pools || []).flatMap((p: any) =>
            (p.service_plans || []).map((sp: any) => sp.technician_id).filter(Boolean)
          )
        )
      )] as string[]

      // Fetch profiles for tech names
      const profileMap: Record<string, string> = {}
      if (techIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', techIds)
        for (const p of profiles || []) {
          profileMap[(p as any).id] = (p as any).full_name ?? '—'
        }
      }

      // Fetch latest service record per customer
      const customerIds = customers.map((c: any) => c.id)
      const recordMap: Record<string, { completed_at: string; technician_id: string; is_flagged: boolean }> = {}
      if (customerIds.length > 0) {
        const { data: records } = await supabase
          .from('service_records')
          .select('customer_id, completed_at, technician_id, is_flagged')
          .in('customer_id', customerIds)
          .order('completed_at', { ascending: false })
        for (const r of records || []) {
          const rec = r as any
          if (!recordMap[rec.customer_id]) recordMap[rec.customer_id] = rec
        }
      }

      const mapped: Row[] = customers.map((c: any) => {
        const pool = c.pools?.[0]
        const sp = pool?.service_plans?.[0]
        const techId = sp?.technician_id
        const techName = techId ? (profileMap[techId] ?? '—') : '—'
        const record = recordMap[c.id]

        let lastService = '—'
        let lastTech = techName
        if (record) {
          const recTechName = profileMap[record.technician_id] ?? techName
          lastService = `${daysAgo(record.completed_at)}${record.is_flagged ? ' · LSI flag' : ''}`
          lastTech = recTechName
        }

        const status: Row['status'] = !c.active ? 'inactive' : record?.is_flagged ? 'warning' : 'good'

        return {
          id: c.id,
          status,
          name: `${c.last_name}, ${c.first_name}`,
          location: suburb(c.address ?? ''),
          plan: sp?.frequency ? capitalize(sp.frequency) : '—',
          lastService: record ? `${lastService} · ${lastTech}` : '—',
          technician: lastTech,
        }
      })

      const uniqueTechs = [...new Set(mapped.map((r) => r.technician).filter((t) => t !== '—'))]
      setTechNames(uniqueTechs)
      setRows(mapped)
      setLoading(false)
    }
    load()
  }, [location.key])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (q && !`${r.name} ${r.location}`.toLowerCase().includes(q.toLowerCase())) return false
      if (planFilter !== 'All plans' && r.plan.toLowerCase() !== planFilter.toLowerCase()) return false
      if (techFilter !== 'All technicians' && r.technician !== techFilter) return false
      return true
    })
  }, [rows, q, planFilter, techFilter])

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Customers</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', minWidth: 220, maxWidth: 320, flex: 1 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search customers...'
            style={{ width: '100%', background: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#111827', boxSizing: 'border-box' }}
          />
        </div>

        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} style={selectStyle}>
          <option>All plans</option>
          <option>Weekly</option>
          <option>Fortnightly</option>
          <option>Monthly</option>
          <option>Custom</option>
        </select>

        <select value={techFilter} onChange={(e) => setTechFilter(e.target.value)} style={selectStyle}>
          <option>All technicians</option>
          {techNames.map((t) => <option key={t}>{t}</option>)}
        </select>

        <button
          onClick={() => navigate('/customers/new')}
          style={{ background: '#111827', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#F9FAFB', cursor: 'pointer', marginLeft: 'auto' }}
        >
          + Add customer
        </button>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Status', 'Name', 'Location', 'Plan', 'Last service', 'Technician', ''].map((h) => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No customers found</td></tr>
              ) : filtered.map((r) => (
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
        )}
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: Row['status'] }) {
  const color = status === 'good' ? '#22C55E' : status === 'warning' ? '#F59E0B' : '#EF4444'
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color }} />
}

function PlanPill({ plan }: { plan: string }) {
  const inactive = plan === '—' || plan.toLowerCase() === 'inactive'
  const style = inactive
    ? { background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }
    : { background: '#E0F2FE', color: '#0284C7' }
  return <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 20, padding: '3px 9px', ...style }}>{plan}</span>
}

const td: React.CSSProperties = { padding: '13px 16px', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }
const selectStyle: React.CSSProperties = { background: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#374151' }

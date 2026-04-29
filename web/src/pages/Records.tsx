import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type RecordRow = {
  id: string
  ref: string | null
  customer: string
  date: string
  technician: string
  ph: number | null
  chlorine: number | null
  lsi: number | null
  is_flagged: boolean
}

export default function Records() {
  const [rows, setRows] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('service_records')
      .select('id, ref, completed_at, lsi_score, is_flagged, readings, customers(first_name, last_name), profiles(full_name)')
      .order('completed_at', { ascending: false })
      .limit(100)
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); return }
        setRows((data || []).map((r) => {
          const readings = r.readings as Record<string, { value: number } | undefined> | null
          const c = r.customers as { first_name: string; last_name: string } | null
          const p = r.profiles as { full_name: string } | null
          return {
            id: r.id,
            ref: r.ref,
            customer: c ? `${c.last_name}, ${c.first_name}` : '—',
            date: r.completed_at ? new Date(r.completed_at).toLocaleDateString('en-NZ') : '—',
            technician: p?.full_name ?? '—',
            ph: readings?.ph?.value ?? null,
            chlorine: readings?.chlorine?.value ?? null,
            lsi: r.lsi_score,
            is_flagged: r.is_flagged,
          }
        }))
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => flaggedOnly ? rows.filter((r) => r.is_flagged) : rows, [flaggedOnly, rows])

  const exportCsv = () => {
    const header = ['ref', 'date', 'customer', 'technician', 'ph', 'chlorine', 'lsi', 'flagged']
    const csv = [header.join(','), ...filtered.map((r) => [r.ref ?? r.id, r.date, r.customer, r.technician, r.ph ?? '', r.chlorine ?? '', r.lsi ?? '', r.is_flagged].join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'service-records.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Service Records</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setFlaggedOnly((v) => !v)}
            style={{ background: flaggedOnly ? '#111827' : '#F3F4F6', color: flaggedOnly ? '#F9FAFB' : '#374151', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            {flaggedOnly ? 'Showing flagged only' : 'Flagged only'}
          </button>
          <button onClick={exportCsv} style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>
      </div>

      {loading && <div style={{ padding: 32, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>Loading…</div>}
      {error && <div style={{ padding: 32, textAlign: 'center', color: '#EF4444', fontSize: 13 }}>{error}</div>}

      {!loading && !error && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>No service records found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Ref', 'Customer', 'Technician', 'pH', 'Chlorine', 'LSI', 'Status'].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/records/${r.id}`)} style={{ cursor: 'pointer' }}>
                    <td style={td}>{r.date}</td>
                    <td style={{ ...td, fontSize: 11, color: '#9CA3AF' }}>{r.ref ?? '—'}</td>
                    <td style={{ ...td, color: '#111827', fontWeight: 600 }}>{r.customer}</td>
                    <td style={td}>{r.technician}</td>
                    <td style={td}>{r.ph != null ? <Traffic value={r.ph} type='ph' /> : '—'}</td>
                    <td style={td}>{r.chlorine != null ? <Traffic value={r.chlorine} type='chlorine' /> : '—'}</td>
                    <td style={td}>{r.lsi != null ? <Traffic value={r.lsi} type='lsi' /> : '—'}</td>
                    <td style={td}><StatusPill flagged={r.is_flagged} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function Traffic({ value, type }: { value: number; type: 'ph' | 'chlorine' | 'lsi' }) {
  let ok = false
  if (type === 'ph') ok = value >= 7.2 && value <= 7.6
  if (type === 'chlorine') ok = value >= 1 && value <= 3
  if (type === 'lsi') ok = value >= -0.5 && value <= 0.5
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#374151', fontSize: 12 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? '#22C55E' : '#EF4444' }} />
      {value}
    </span>
  )
}

function StatusPill({ flagged }: { flagged: boolean }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 20, padding: '3px 9px', background: flagged ? '#FEF2F2' : '#F0FDF4', color: flagged ? '#DC2626' : '#16A34A' }}>
      {flagged ? 'Flagged' : 'Good'}
    </span>
  )
}

const th: React.CSSProperties = { padding: '11px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }
const td: React.CSSProperties = { padding: '13px 16px', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }

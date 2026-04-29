import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type RecordRow = {
  id: string
  customer: string
  date: string
  technician: string
  ph: number
  chlorine: number
  lsi: number
}

const rows: RecordRow[] = [
  { id: 'r-2043', customer: 'Smith, David', date: '2026-03-31', technician: 'James T.', ph: 7.4, chlorine: 0.8, lsi: -0.4 },
  { id: 'r-2042', customer: 'Williams, Sarah', date: '2026-03-31', technician: 'James T.', ph: 7.5, chlorine: 1.9, lsi: 0.1 },
  { id: 'r-2041', customer: 'Chen, Michael', date: '2026-03-30', technician: 'Mike R.', ph: 7.8, chlorine: 1.1, lsi: 0.6 },
  { id: 'r-2040', customer: 'Johnson, Anne', date: '2026-03-30', technician: 'Sarah K.', ph: 7.3, chlorine: 2.2, lsi: 0.0 },
]

export default function Records() {
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!flaggedOnly) return rows
    return rows.filter((r) => isFlagged(r))
  }, [flaggedOnly])

  const exportCsv = () => {
    const header = ['id', 'customer', 'date', 'technician', 'ph', 'chlorine', 'lsi']
    const csv = [header.join(','), ...filtered.map((r) => [r.id, r.customer, r.date, r.technician, r.ph, r.chlorine, r.lsi].join(','))].join('\n')
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
            style={{
              background: flaggedOnly ? '#111827' : '#F3F4F6',
              color: flaggedOnly ? '#F9FAFB' : '#374151',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {flaggedOnly ? 'Showing flagged only' : 'Flagged only'}
          </button>
          <button
            onClick={exportCsv}
            style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Date', 'Customer', 'Technician', 'pH', 'Chlorine', 'LSI', 'Status'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} onClick={() => navigate(`/records/${r.id}`)} style={{ cursor: 'pointer' }}>
                <td style={td}>{r.date}</td>
                <td style={{ ...td, color: '#111827', fontWeight: 600 }}>{r.customer}</td>
                <td style={td}>{r.technician}</td>
                <td style={td}><Traffic value={r.ph} type='ph' /></td>
                <td style={td}><Traffic value={r.chlorine} type='chlorine' /></td>
                <td style={td}><Traffic value={r.lsi} type='lsi' /></td>
                <td style={td}><StatusPill flagged={isFlagged(r)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function isFlagged(r: RecordRow) {
  return r.ph < 7.2 || r.ph > 7.6 || r.chlorine < 1 || r.chlorine > 3 || r.lsi < -0.5 || r.lsi > 0.5
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
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        borderRadius: 20,
        padding: '3px 9px',
        background: flagged ? '#FEF2F2' : '#F0FDF4',
        color: flagged ? '#DC2626' : '#16A34A',
      }}
    >
      {flagged ? 'Flagged' : 'Good'}
    </span>
  )
}

const th: React.CSSProperties = {
  padding: '11px 16px',
  textAlign: 'left',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#64748B',
  background: '#F9FAFB',
  borderBottom: '1px solid #E5E7EB',
}

const td: React.CSSProperties = {
  padding: '13px 16px',
  fontSize: 13,
  color: '#6B7280',
  borderBottom: '1px solid #F3F4F6',
}

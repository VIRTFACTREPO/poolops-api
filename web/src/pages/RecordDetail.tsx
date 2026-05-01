import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Reading = { value: number; status: string }
type Readings = {
  ph?: Reading
  chlorine?: Reading
  alkalinity?: Reading
  calcium?: Reading
  stabiliser?: Reading
}
type Treatment = { product_name: string; unit: string; recommended: number; actual: number }

type Record = {
  id: string
  ref: string | null
  completed_at: string
  lsi_score: number
  lsi_label: string
  is_flagged: boolean
  readings: Readings
  treatments: Treatment[]
  customer_note: string | null
  office_note: string | null
  customers: { first_name: string; last_name: string; address: string } | null
  profiles: { full_name: string } | null
  pools: { pool_type: string; volume_litres: number } | null
}

const READING_LABELS: { key: keyof Readings; label: string; min: number; max: number }[] = [
  { key: 'ph', label: 'pH', min: 7.2, max: 7.6 },
  { key: 'chlorine', label: 'Free Chlorine', min: 1.0, max: 3.0 },
  { key: 'alkalinity', label: 'Alkalinity', min: 80, max: 120 },
  { key: 'calcium', label: 'Calcium Hardness', min: 200, max: 400 },
  { key: 'stabiliser', label: 'Stabiliser', min: 30, max: 50 },
]

export default function RecordDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState<Record | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [officeNote, setOfficeNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('service_records')
      .select('id, ref, completed_at, lsi_score, lsi_label, is_flagged, readings, treatments, customer_note, office_note, customers(first_name, last_name, address), profiles!technician_id(full_name), pools(pool_type, volume_litres)')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); return }
        const r = data as any
        const rec: Record = {
          id: r.id,
          ref: r.ref,
          completed_at: r.completed_at,
          lsi_score: r.lsi_score,
          lsi_label: r.lsi_label,
          is_flagged: r.is_flagged,
          readings: r.readings as Readings,
          treatments: (r.treatments || []) as Treatment[],
          customer_note: r.customer_note,
          office_note: r.office_note,
          customers: r.customers as Record['customers'],
          profiles: r.profiles as Record['profiles'],
          pools: r.pools as Record['pools'],
        }
        setRecord(rec)
        setOfficeNote(r.office_note ?? '')
      })
      .finally(() => setLoading(false))
  }, [id])

  const saveOfficeNote = async () => {
    if (!id) return
    setSaving(true)
    setSaved(false)
    const { error: err } = await supabase
      .from('service_records')
      .update({ office_note: officeNote })
      .eq('id', id)
    setSaving(false)
    if (!err) setSaved(true)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>Loading…</div>
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444', fontSize: 13 }}>{error}</div>
  if (!record) return null

  const customer = record.customers
  const completedDate = record.completed_at
    ? new Date(record.completed_at).toLocaleString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button onClick={() => navigate('/records')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 13, padding: 0 }}>← Records</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
            {customer ? `${customer.last_name}, ${customer.first_name}` : '—'}
          </h1>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            {customer?.address ?? '—'} · {completedDate}
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            {record.ref ?? record.id} · {record.profiles?.full_name ?? '—'}
            {record.pools ? ` · ${record.pools.pool_type} · ${record.pools.volume_litres.toLocaleString()}L` : ''}
          </div>
        </div>
        {record.is_flagged && (
          <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '4px 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECDD3', whiteSpace: 'nowrap' }}>
            ⚑ Flagged reading
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={card}>
          <Title>Chemical Readings</Title>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {READING_LABELS.map(({ key, label, min, max }) => {
                const entry = record.readings[key]
                if (!entry) return null
                const inRange = entry.value >= min && entry.value <= max
                return (
                  <tr key={key}>
                    <td style={tdStyle}>{label}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: inRange ? '#15803D' : '#B91C1C' }}>
                      {entry.value}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: 11, color: '#9CA3AF', width: 80 }}>
                      {min}–{max}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div style={{ marginTop: 12, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#B45309', marginBottom: 4 }}>LSI Water Balance</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: Math.abs(record.lsi_score) <= 0.5 ? '#15803D' : '#B91C1C' }}>
              {record.lsi_score >= 0 ? '+' : ''}{record.lsi_score.toFixed(2)}
            </div>
            <div style={{ fontSize: 12, color: '#92400E' }}>{record.lsi_label}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <div style={card}>
            <Title>Treatments Applied</Title>
            {(record.treatments || []).length === 0 ? (
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>No treatments recorded.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {record.treatments.map((t, i) => (
                  <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 10 }}>
                    <div style={{ color: '#111827', fontSize: 13, fontWeight: 600 }}>{t.product_name}</div>
                    <div style={{ color: '#6B7280', fontSize: 12 }}>
                      Recommended: {t.recommended}{t.unit} · Used: {t.actual}{t.unit}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {record.customer_note && (
            <div style={card}>
              <Title>Tech Note</Title>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{record.customer_note}</div>
            </div>
          )}

          <div style={card}>
            <Title>Office Note</Title>
            <textarea
              value={officeNote}
              onChange={(e) => { setOfficeNote(e.target.value); setSaved(false) }}
              placeholder='Add an office note…'
              style={{ width: '100%', minHeight: 90, background: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: 10, padding: 10, color: '#111827', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
            />
            <button
              onClick={saveOfficeNote}
              disabled={saving}
              style={{ marginTop: 8, background: saving ? '#D1D5DB' : '#111827', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{children}</div>
}

const card: React.CSSProperties = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: 16 }
const tdStyle: React.CSSProperties = { padding: '8px 0', borderBottom: '1px solid #F3F4F6', color: '#374151', fontSize: 13 }

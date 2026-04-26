import { useState } from 'react'
import { useParams } from 'react-router-dom'

const treatments = [
  { id: 't1', name: 'Liquid Chlorine', amount: '400 ml', note: 'Raise free chlorine' },
  { id: 't2', name: 'Muriatic Acid', amount: '120 ml', note: 'Bring pH down' },
]

export default function RecordDetail() {
  const { id } = useParams()
  const [officeNote, setOfficeNote] = useState('Customer requested Friday visits where possible.')

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F9FAFB' }}>Record Detail — {id}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={card}>
          <Title>Readings</Title>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <Row k='Free Chlorine' v='0.8 ppm' bad />
              <Row k='pH' v='7.4' />
              <Row k='Alkalinity' v='95 ppm' />
              <Row k='Calcium Hardness' v='280 ppm' />
              <Row k='CYA' v='42 ppm' />
            </tbody>
          </table>

          <div style={{ marginTop: 12, background: '#2A1F0A', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748B' }}>LSI</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#FCD34D' }}>-0.40</div>
            <div style={{ fontSize: 12, color: '#FCD34D' }}>Slightly corrosive</div>
          </div>
        </div>

        <div style={card}>
          <Title>Treatments</Title>
          <div style={{ display: 'grid', gap: 8 }}>
            {treatments.map((t) => (
              <div key={t.id} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 10, padding: 10 }}>
                <div style={{ color: '#F9FAFB', fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                <div style={{ color: '#94A3B8', fontSize: 12 }}>{t.amount} · {t.note}</div>
              </div>
            ))}
          </div>

          <Title style={{ marginTop: 12 }}>Photos</Title>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={photo}>Before</div>
            <div style={photo}>After</div>
          </div>

          <Title style={{ marginTop: 12 }}>Notes</Title>
          <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 10, padding: 10, color: '#D1D5DB', fontSize: 13 }}>
            Customer note: Cloudy water after heavy rain. Requested extra clarification.
          </div>

          <Title style={{ marginTop: 12 }}>Office note (editable)</Title>
          <textarea
            value={officeNote}
            onChange={(e) => setOfficeNote(e.target.value)}
            style={{
              width: '100%',
              minHeight: 90,
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: 10,
              padding: 10,
              color: '#F9FAFB',
              fontSize: 13,
            }}
          />
        </div>
      </div>
    </div>
  )
}

function Title({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8, ...style }}>{children}</div>
}

function Row({ k, v, bad }: { k: string; v: string; bad?: boolean }) {
  return (
    <tr>
      <td style={{ padding: '7px 0', borderBottom: '1px solid #1F2937', color: '#64748B', fontSize: 12 }}>{k}</td>
      <td style={{ padding: '7px 0', borderBottom: '1px solid #1F2937', color: bad ? '#F87171' : '#D1D5DB', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{v}</td>
    </tr>
  )
}

const card: React.CSSProperties = {
  background: '#1E293B',
  border: '1px solid #334155',
  borderRadius: 14,
  padding: 14,
}

const photo: React.CSSProperties = {
  background: '#0F172A',
  border: '1px dashed #334155',
  borderRadius: 10,
  minHeight: 90,
  display: 'grid',
  placeItems: 'center',
  color: '#64748B',
  fontSize: 12,
}

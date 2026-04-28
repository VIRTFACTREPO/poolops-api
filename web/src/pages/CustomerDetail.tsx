import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

type Tab = 'Overview' | 'Pool' | 'Service History' | 'Billing'

const historyRows = [
  { id: 'h1', date: 'Today · 31 Mar', tech: 'James T. · 9:42am', ph: '7.4', chlorine: '0.8', lsi: '-0.4', status: 'Flagged' },
  { id: 'h2', date: '24 Mar', tech: 'James T. · 10:15am', ph: '7.7', chlorine: '1.6', lsi: '-0.2', status: 'Warning' },
  { id: 'h3', date: '17 Mar', tech: 'James T. · 9:55am', ph: '7.4', chlorine: '1.9', lsi: '+0.1', status: 'Good' },
  { id: 'h4', date: '10 Mar', tech: 'James T. · 9:30am', ph: '7.3', chlorine: '2.0', lsi: '+0.1', status: 'Good' },
]

export default function CustomerDetail() {
  const { id } = useParams()
  const [tab, setTab] = useState<Tab>('Overview')

  const title = useMemo(() => {
    if (!id) return 'Customer'
    const [a = '', b = ''] = id.split('-')
    return `${capitalize(a)}, ${capitalize(b)}`
  }, [id])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#1E293B', border: '1px solid #334155', display: 'grid', placeItems: 'center', color: '#6B7280', fontWeight: 700 }}>
            {title.split(',').map((s) => s.trim()[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{title}</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>12 Remuera Rd, Remuera · Active · Weekly · James T.</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 20, padding: '3px 9px', background: 'rgba(74,222,128,0.1)', color: '#4ADE80' }}>Active</span>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: 20 }}>
        {(['Overview', 'Pool', 'Service History', 'Billing'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 500,
              color: tab === t ? '#F9FAFB' : '#64748B',
              border: 'none',
              borderBottom: tab === t ? '2px solid #F9FAFB' : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title='Contact'>
            <Row k='Email' v='david@smithremuera.co.nz' />
            <Row k='Phone' v='021 456 789' />
            <Row k='Address' v='12 Remuera Rd, Remuera, Auckland' />
            <Row k='Service plan' v='Weekly — Mondays' />
            <Row k='Assigned tech' v='James T.' />
            <Row k='Customer since' v='March 2024' />
          </Card>
          <Card title='Pool summary'>
            <Row k='Volume' v='55,000 L' />
            <Row k='Type' v='Concrete · Chlorine' />
            <Row k='Surface' v='Pebblecrete' />
            <Row k='Equipment' v='Hayward pump · Astral filter' />
            <Row k='Access' v='Gate code 4521 · Dog Tuesdays' />
            <Row k='Last LSI' v='−0.4 Slightly corrosive' warn />
          </Card>
        </div>
      )}

      {tab === 'Pool' && (
        <Card title='Pool'>
          <Row k='Construction' v='In-ground concrete pool' />
          <Row k='Dimensions' v='11m x 4m' />
          <Row k='Heating' v='Heat pump installed' />
          <Row k='Sanitizer' v='Liquid chlorine' />
        </Card>
      )}

      {tab === 'Service History' && (
        <Card title='Recent services'>
          {historyRows.map((r) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr auto', alignItems: 'center', gap: 12, borderBottom: '1px solid #F3F4F6', padding: '10px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrafficDot status={r.status} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{r.date}</div>
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                {r.tech} · pH {r.ph} · Cl {r.chlorine} · LSI {r.lsi}
              </div>
              <StatusPill status={r.status} />
            </div>
          ))}
        </Card>
      )}

      {tab === 'Billing' && (
        <Card title='Billing'>
          <Row k='Plan' v='Pro Monthly' />
          <Row k='Next invoice' v='1 Apr 2026' />
          <Row k='Payment method' v='Visa •••• 8832' />
        </Card>
      )}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 14, padding: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#64748B', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ fontSize: 12, color: '#64748B' }}>{k}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: warn ? '#FCD34D' : '#D1D5DB' }}>{v}</span>
    </div>
  )
}

function TrafficDot({ status }: { status: string }) {
  const bg = status === 'Good' ? '#22C55E' : status === 'Warning' ? '#F59E0B' : '#EF4444'
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: bg }} />
}

function StatusPill({ status }: { status: string }) {
  const style =
    status === 'Good'
      ? { background: 'rgba(74,222,128,0.1)', color: '#4ADE80' }
      : status === 'Warning'
      ? { background: 'rgba(245,158,11,0.12)', color: '#FCD34D' }
      : { background: 'rgba(239,68,68,0.12)', color: '#F87171' }
  return <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 20, padding: '3px 9px', ...style }}>{status}</span>
}

function capitalize(v: string) {
  return v ? v[0].toUpperCase() + v.slice(1) : v
}

import { useState } from 'react'

export default function CustomerForm() {
  const [name, setName] = useState('')

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Add / Edit Customer</h1>

      <Section title='1) Contact'>
        <Fields>
          <input style={field} placeholder='Full name' value={name} onChange={(e) => setName(e.target.value)} />
          <input style={field} placeholder='Email' />
          <input style={field} placeholder='Phone' />
        </Fields>
      </Section>

      <Section title='2) Pool'>
        <Fields>
          <input style={field} placeholder='Pool address' />
          <input style={field} placeholder='Volume (litres)' />
          <input style={field} placeholder='Pool type / surface' />
        </Fields>
      </Section>

      <Section title='3) Access'>
        <Fields>
          <input style={field} placeholder='Gate code / lockbox' />
          <input style={field} placeholder='Site notes (pets, alarms, etc.)' />
        </Fields>
      </Section>

      <Section title='4) Service plan'>
        <Fields>
          <select style={field as React.CSSProperties} defaultValue='Weekly'>
            <option>Weekly</option>
            <option>Fortnightly</option>
            <option>Monthly</option>
          </select>
          <select style={field as React.CSSProperties} defaultValue='Monday'>
            <option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option>
          </select>
        </Fields>
      </Section>

      <Section title='5) Chemicals'>
        <Fields>
          <input style={field} placeholder='Preferred sanitizer' />
          <input style={field} placeholder='Target pH range' />
          <input style={field} placeholder='Target chlorine range' />
        </Fields>
      </Section>

      <div style={{ background: '#2A1F0A', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D', borderRadius: 10, padding: 12, fontSize: 12 }}>
        ⚠ Amber warning: Owner invite will be sent once saved. Please verify contact details and service frequency.
      </div>

      <button style={{ background: '#F9FAFB', color: '#111827', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        Save & invite owner
      </button>

      <div style={{ fontSize: 12, color: '#64748B' }}>Preview name: {name || '—'}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function Fields({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gap: 10 }}>{children}</div>
}

const field: React.CSSProperties = {
  background: '#F9FAFB',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#111827',
  fontSize: 13,
}

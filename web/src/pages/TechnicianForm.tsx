import { useState } from 'react'

export default function TechnicianForm() {
  const [name, setName] = useState('')
  const [role, setRole] = useState('Technician')
  const [sms, setSms] = useState(true)
  const [email, setEmail] = useState(true)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
      <div style={{ display: 'grid', gap: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Add / Edit Technician</h1>

        <div style={card}>
          <Label>Name</Label>
          <input style={field} placeholder='Full name' value={name} onChange={(e) => setName(e.target.value)} />

          <Label style={{ marginTop: 10 }}>Email</Label>
          <input style={field} placeholder='email@company.com' />

          <Label style={{ marginTop: 10 }}>Phone</Label>
          <input style={field} placeholder='021 ...' />
        </div>

        <div style={card}>
          <Label>Role</Label>
          <select style={field} value={role} onChange={(e) => setRole(e.target.value)}>
            <option>Technician</option>
            <option>Senior Technician</option>
            <option>Supervisor</option>
          </select>
        </div>

        <div style={card}>
          <Label>Notifications</Label>
          <Toggle label='SMS alerts' checked={sms} onChange={setSms} />
          <Toggle label='Email alerts' checked={email} onChange={setEmail} />
        </div>

        <button style={{ background: '#F9FAFB', color: '#111827', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Save & send invitation
        </button>
      </div>

      <div style={{ ...card, height: 'fit-content' }}>
        <Label>Live preview</Label>
        <div style={{ background: '#F9FAFB', border: '1px solid #334155', borderRadius: 12, padding: 12, display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#334155', color: '#6B7280', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>
              {initials(name)}
            </div>
            <div>
              <div style={{ color: '#111827', fontSize: 13, fontWeight: 600 }}>{name || 'New Technician'}</div>
              <div style={{ color: '#64748B', fontSize: 11 }}>{role}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>SMS: {sms ? 'On' : 'Off'} · Email: {email ? 'On' : 'Off'}</div>
        </div>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} style={{ marginTop: 8, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', color: '#374151', cursor: 'pointer' }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 12, color: checked ? '#4ADE80' : '#64748B' }}>{checked ? 'Enabled' : 'Disabled'}</span>
    </button>
  )
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', ...style }}>{children}</div>
}

const card: React.CSSProperties = {
  background: '#1E293B',
  border: '1px solid #334155',
  borderRadius: 14,
  padding: 14,
}

const field: React.CSSProperties = {
  marginTop: 6,
  width: '100%',
  background: '#F9FAFB',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#111827',
  fontSize: 13,
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'NT'
  return parts.map((p) => p[0]?.toUpperCase()).slice(0, 2).join('')
}

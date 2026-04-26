import { useNavigate } from 'react-router-dom'

const staff = [
  { id: 't1', name: 'James T.', role: 'Technician', jobs: '8/10', status: 'On route' },
  { id: 't2', name: 'Mike R.', role: 'Technician', jobs: '5/10', status: 'On route' },
  { id: 't3', name: 'Sarah K.', role: 'Senior Technician', jobs: '10/10', status: 'Done' },
]

export default function Team() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F9FAFB' }}>Team</h1>
        <button
          onClick={() => navigate('/team/new')}
          style={{ background: '#F9FAFB', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#111827', cursor: 'pointer' }}
        >
          + Add technician
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        {staff.map((p) => (
          <div key={p.id} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#334155', color: '#94A3B8', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>
                {p.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{p.role}</div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#94A3B8' }}>Jobs: {p.jobs}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: p.status === 'Done' ? '#4ADE80' : '#38BDF8' }}>{p.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

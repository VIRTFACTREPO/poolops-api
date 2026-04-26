type Tech = {
  id: string
  name: string
  role: string
  initials: string
  color: string
  done: number
  assigned: number
  currentJob?: string
}

const team: Tech[] = [
  { id: 't1', name: 'James T.', role: 'Technician', initials: 'JT', color: '#38BDF8', done: 8, assigned: 10, currentJob: 'Johnson, Anne · Epsom' },
  { id: 't2', name: 'Mike R.', role: 'Technician', initials: 'MR', color: '#A78BFA', done: 5, assigned: 10, currentJob: 'Chen, Michael · Mt Eden' },
  { id: 't3', name: 'Sarah K.', role: 'Senior Technician', initials: 'SK', color: '#4ADE80', done: 10, assigned: 10 },
  { id: 't4', name: 'Nina P.', role: 'Technician', initials: 'NP', color: '#F59E0B', done: 6, assigned: 9, currentJob: 'Wong, Helen · Herne Bay' },
  { id: 't5', name: 'Alex W.', role: 'Technician', initials: 'AW', color: '#F87171', done: 4, assigned: 8, currentJob: 'Peters, Sarah · Ponsonby' },
  { id: 't6', name: 'Leo D.', role: 'Technician', initials: 'LD', color: '#22D3EE', done: 7, assigned: 9 },
]

export default function Team() {
  const totals = {
    technicians: team.length,
    onRoute: team.filter((t) => t.currentJob).length,
    completed: team.reduce((a, t) => a + t.done, 0),
    assigned: team.reduce((a, t) => a + t.assigned, 0),
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F9FAFB' }}>Team</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        <Stat title='Technicians' value={totals.technicians} />
        <Stat title='On route now' value={totals.onRoute} accent='#38BDF8' />
        <Stat title='Jobs completed' value={totals.completed} accent='#4ADE80' />
        <Stat title='Assigned today' value={totals.assigned} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        {team.map((p) => {
          const pct = Math.round((p.done / p.assigned) * 100)
          return (
            <div key={p.id} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${p.color}22`, color: p.color, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>
                  {p.initials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{p.role}</div>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: '#94A3B8' }}>Progress {p.done}/{p.assigned}</div>
              <div style={{ marginTop: 6, height: 8, borderRadius: 99, background: '#0F172A', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: p.color }} />
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: p.currentJob ? '#38BDF8' : '#64748B' }}>
                {p.currentJob ? `● Live: ${p.currentJob}` : '✓ No active job'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ title, value, accent }: { title: string; value: number; accent?: string }) {
  return (
    <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B' }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 22, fontWeight: 700, color: accent || '#F9FAFB' }}>{value}</div>
    </div>
  )
}

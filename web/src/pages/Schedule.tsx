import { useMemo, useState } from 'react'

type ViewMode = 'day' | 'week'
type JobState = 'pending' | 'complete' | 'flagged' | 'warning'

type Job = {
  id: string
  customer: string
  area: string
  state: JobState
  note: string
}

type Technician = {
  id: string
  initials: string
  name: string
  status: string
  statusColor: string
  jobs: Job[]
}

const initialTechs: Technician[] = [
  {
    id: 'tech-1',
    initials: 'JT',
    name: 'James T.',
    status: '● On route · 8/10',
    statusColor: '#38BDF8',
    jobs: [
      { id: 'j1', customer: 'Williams, James', area: 'Ponsonby', state: 'complete', note: 'Done 9:14am' },
      { id: 'j2', customer: 'Brown, Lisa', area: 'Newmarket', state: 'complete', note: 'Done 8:51am' },
      { id: 'j3', customer: 'Taylor, Mark', area: 'Grafton', state: 'complete', note: 'Done 8:22am' },
      { id: 'j4', customer: 'Smith, David', area: 'Remuera', state: 'flagged', note: '⚑ Cl LOW flagged' },
      { id: 'j5', customer: 'Johnson, Anne', area: 'Epsom', state: 'pending', note: 'Up next' },
      { id: 'j6', customer: 'Chen, Michael', area: 'Mt Eden', state: 'pending', note: 'Pending' },
      { id: 'j7', customer: 'Peters, Sarah', area: 'Ponsonby', state: 'pending', note: 'Pending' },
      { id: 'j8', customer: 'Wong, Helen', area: 'Herne Bay', state: 'pending', note: 'Pending' },
    ],
  },
  {
    id: 'tech-2',
    initials: 'MR',
    name: 'Mike R.',
    status: '● On route · 5/10',
    statusColor: '#38BDF8',
    jobs: [
      { id: 'j9', customer: 'Adams, Peter', area: 'Auckland CBD', state: 'complete', note: 'Done 8:30am' },
      { id: 'j10', customer: 'Hill, Karen', area: 'Mt Albert', state: 'complete', note: 'Done 9:05am' },
      { id: 'j11', customer: 'Chen, Susan', area: 'Mt Eden', state: 'warning', note: '⚑ LSI flagged' },
      { id: 'j12', customer: 'Gray, Tom', area: 'Sandringham', state: 'pending', note: 'Pending' },
      { id: 'j13', customer: 'Lee, David', area: 'Kingsland', state: 'pending', note: 'Pending' },
      { id: 'j14', customer: 'Moore, Jane', area: 'Grey Lynn', state: 'pending', note: 'Pending' },
    ],
  },
  {
    id: 'tech-3',
    initials: 'SK',
    name: 'Sarah K.',
    status: '✓ Done · 10/10',
    statusColor: '#4ADE80',
    jobs: [
      { id: 'j15', customer: 'Stewart, Rob', area: 'Remuera', state: 'complete', note: 'Done 7:58am' },
      { id: 'j16', customer: 'Walsh, Mary', area: 'Parnell', state: 'complete', note: 'Done 8:34am' },
      { id: 'j17', customer: 'King, Paul', area: 'Newmarket', state: 'complete', note: 'Done 9:12am' },
      { id: 'j18', customer: 'Young, Alice', area: 'Epsom', state: 'complete', note: 'Done 9:48am' },
      { id: 'j19', customer: 'Scott, Brian', area: 'Remuera', state: 'complete', note: 'Done 10:22am' },
    ],
  },
]

const stateStyle: Record<JobState, { bg: string; border: string; title: string; sub: string }> = {
  pending: { bg: '#1A3A5C', border: 'rgba(56,189,248,0.25)', title: '#93C5FD', sub: 'rgba(96,165,250,0.75)' },
  complete: { bg: '#14291A', border: 'rgba(74,222,128,0.2)', title: '#86EFAC', sub: 'rgba(134,239,172,0.7)' },
  flagged: { bg: '#2D1A1A', border: 'rgba(239,68,68,0.3)', title: '#FCA5A5', sub: 'rgba(252,165,165,0.75)' },
  warning: { bg: '#2A1F0A', border: 'rgba(245,158,11,0.3)', title: '#FCD34D', sub: 'rgba(252,211,77,0.75)' },
}

export default function Schedule() {
  const [view, setView] = useState<ViewMode>('day')
  const [offset, setOffset] = useState(0)
  const [techs, setTechs] = useState<Technician[]>(initialTechs)

  const dateLabel = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }, [offset])

  const onDragStart = (jobId: string, fromTechId: string) => (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ jobId, fromTechId }))
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDropTech = (toTechId: string) => async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const raw = event.dataTransfer.getData('application/json')
    if (!raw) return

    const { jobId, fromTechId } = JSON.parse(raw) as { jobId: string; fromTechId: string }
    if (fromTechId === toTechId) return

    let movedJob: Job | undefined
    setTechs((prev) => {
      const next = prev.map((t) => ({ ...t, jobs: [...t.jobs] }))
      const from = next.find((t) => t.id === fromTechId)
      const to = next.find((t) => t.id === toTechId)
      if (!from || !to) return prev
      const idx = from.jobs.findIndex((j) => j.id === jobId)
      if (idx < 0) return prev
      movedJob = from.jobs[idx]
      from.jobs.splice(idx, 1)
      to.jobs.push(movedJob)
      return next
    })

    try {
      const base = import.meta.env.VITE_API_BASE_URL || ''
      await fetch(`${base}/admin/jobs/${jobId}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: toTechId }),
      })
    } catch {
      // no-op for now (mock wiring phase)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={arrowBtn} onClick={() => setOffset((v) => v - (view === 'day' ? 1 : 7))}>‹</button>
            <button style={arrowBtn} onClick={() => setOffset((v) => v + (view === 'day' ? 1 : 7))}>›</button>
          </div>
          <button style={todayBtn} onClick={() => setOffset(0)}>Today</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB' }}>{dateLabel}</span>
        </div>

        <div style={{ display: 'flex', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, overflow: 'hidden' }}>
          <button style={view === 'day' ? viewBtnActive : viewBtn} onClick={() => setView('day')}>Day</button>
          <button style={view === 'week' ? viewBtnActive : viewBtn} onClick={() => setView('week')}>Week</button>
        </div>

        <button style={addJobBtn}>+ Add job</button>
      </div>

      <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', background: '#0F172A', borderBottom: '1px solid #334155', padding: '10px 16px' }}>
          <div style={headerCell}>Technician</div>
          <div style={headerCell}>Jobs — drag to reassign</div>
        </div>

        {techs.map((tech, idx) => (
          <div key={tech.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', minHeight: 90, borderBottom: idx === techs.length - 1 ? 'none' : '1px solid #1F2937' }}>
            <div style={{ padding: '14px 16px', borderRight: '1px solid #1F2937', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#334155', color: '#94A3B8', fontSize: 10, fontWeight: 600, display: 'grid', placeItems: 'center' }}>{tech.initials}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB' }}>{tech.name}</div>
                <div style={{ fontSize: 11, marginTop: 3, color: tech.statusColor }}>{tech.status}</div>
              </div>
            </div>

            <div
              style={{ padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropTech(tech.id)}
            >
              {tech.jobs.map((job) => {
                const s = stateStyle[job.state]
                return (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={onDragStart(job.id, tech.id)}
                    style={{
                      borderRadius: 8,
                      padding: '7px 10px',
                      minWidth: 120,
                      border: `1px solid ${s.border}`,
                      background: s.bg,
                      cursor: 'grab',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: s.title }}>{job.customer}</div>
                    <div style={{ fontSize: 10, marginTop: 2, color: s.sub }}>{job.area}</div>
                    <div style={{ fontSize: 10, marginTop: 3, opacity: 0.6, color: '#94A3B8' }}>{job.note}</div>
                  </div>
                )
              })}

              <button style={addSlotBtn}>+ Add job</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, padding: '0 2px' }}>
        <Legend color='#1A3A5C' border='rgba(56,189,248,0.3)' label='Pending' />
        <Legend color='#14291A' border='rgba(74,222,128,0.2)' label='Complete' />
        <Legend color='#2D1A1A' border='rgba(239,68,68,0.3)' label='Flagged reading' />
        <Legend color='#2A1F0A' border='rgba(245,158,11,0.3)' label='LSI warning' />
      </div>
    </div>
  )
}

function Legend({ color, border, label }: { color: string; border: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B' }}>
      <span style={{ width: 8, height: 8, borderRadius: 3, background: color, border: `1px solid ${border}` }} />
      {label}
    </div>
  )
}

const headerCell: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#64748B',
}

const arrowBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: '#1E293B',
  border: '1px solid #334155',
  color: '#94A3B8',
  cursor: 'pointer',
}

const todayBtn: React.CSSProperties = {
  height: 32,
  padding: '0 14px',
  background: '#1E293B',
  border: '1px solid #334155',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  color: '#94A3B8',
  cursor: 'pointer',
}

const viewBtn: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  color: '#64748B',
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
}

const viewBtnActive: React.CSSProperties = {
  ...viewBtn,
  background: '#334155',
  color: '#F9FAFB',
}

const addJobBtn: React.CSSProperties = {
  height: 32,
  padding: '0 16px',
  background: '#F9FAFB',
  border: 'none',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  color: '#111827',
  cursor: 'pointer',
}

const addSlotBtn: React.CSSProperties = {
  border: '1px dashed #334155',
  borderRadius: 8,
  padding: '7px 10px',
  cursor: 'pointer',
  fontSize: 11,
  color: '#475569',
  background: 'transparent',
  height: 'fit-content',
}

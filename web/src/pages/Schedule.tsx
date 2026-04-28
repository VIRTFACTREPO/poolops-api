import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type ViewMode = 'day' | 'week'
type JobState = 'pending' | 'in_progress' | 'complete' | 'flagged'

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
  jobs: Job[]
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function toISODate(d: Date) {
  return d.toISOString().split('T')[0]
}

function jobState(status: string, isFlagged: boolean): JobState {
  if (status === 'complete') return isFlagged ? 'flagged' : 'complete'
  if (status === 'in_progress') return 'in_progress'
  return 'pending'
}

function jobNote(status: string, isFlagged: boolean, completedAt: string | null): string {
  if (status === 'complete' && completedAt) {
    const t = new Date(completedAt).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' })
    return isFlagged ? `⚑ Flagged · Done ${t}` : `Done ${t}`
  }
  if (status === 'in_progress') return '● In progress'
  return 'Pending'
}

function techStatus(jobs: Job[]): { label: string; color: string } {
  const total = jobs.length
  const done = jobs.filter((j) => j.state === 'complete' || j.state === 'flagged').length
  const inProgress = jobs.some((j) => j.state === 'in_progress')
  if (total === 0) return { label: 'No jobs today', color: '#6B7280' }
  if (done === total) return { label: `✓ Done · ${done}/${total}`, color: '#15803D' }
  if (inProgress) return { label: `● On route · ${done}/${total}`, color: '#0369A1' }
  return { label: `${done}/${total} complete`, color: '#6B7280' }
}

const stateStyle: Record<JobState, { bg: string; border: string; title: string; sub: string }> = {
  pending:     { bg: '#EFF6FF', border: '#BFDBFE',  title: '#1E40AF', sub: '#3B82F6' },
  in_progress: { bg: '#F0F9FF', border: '#7DD3FC',  title: '#0369A1', sub: '#0EA5E9' },
  complete:    { bg: '#F0FDF4', border: '#BBF7D0',  title: '#15803D', sub: '#22C55E' },
  flagged:     { bg: '#FFF1F2', border: '#FECDD3',  title: '#B91C1C', sub: '#EF4444' },
}

export default function Schedule() {
  const [view, setView] = useState<ViewMode>('day')
  const [offset, setOffset] = useState(0)
  const [techs, setTechs] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d
  }, [offset])

  const dateLabel = useMemo(() =>
    selectedDate.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    [selectedDate],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      const date = toISODate(selectedDate)

      const { data: jobs, error: jobErr } = await supabase
        .from('jobs')
        .select(`id, status, completed_at, route_order, technician_id, pools ( customers ( first_name, last_name, address ) )`)
        .eq('scheduled_date', date)
        .order('route_order')

      if (jobErr) throw jobErr

      const techIds = [...new Set((jobs || []).map((j) => j.technician_id))]
      const [recordsRes, profilesRes] = await Promise.all([
        supabase.from('service_records').select('job_id, is_flagged').in('job_id', (jobs || []).map((j) => j.id)),
        supabase.from('profiles').select('id, full_name').in('id', techIds),
      ])

      const flaggedSet = new Set((recordsRes.data || []).filter((r) => r.is_flagged).map((r) => r.job_id))
      const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p.full_name as string]))

      const byTech = new Map<string, Technician>()

      for (const j of jobs || []) {
        const techName = profileMap.get(j.technician_id) || 'Unknown'
        const pool = j.pools as unknown as { customers: { first_name: string; last_name: string; address: string } } | null
        const customer = pool?.customers

        if (!byTech.has(j.technician_id)) {
          byTech.set(j.technician_id, {
            id: j.technician_id,
            initials: initials(techName),
            name: techName,
            jobs: [],
          })
        }

        const isFlagged = flaggedSet.has(j.id)
        byTech.get(j.technician_id)!.jobs.push({
          id: j.id,
          customer: customer ? `${customer.last_name}, ${customer.first_name}` : 'Unknown',
          area: customer?.address?.split(',').slice(-2, -1)[0]?.trim() || '',
          state: jobState(j.status, isFlagged),
          note: jobNote(j.status, isFlagged, j.completed_at),
        })
      }

      if (!cancelled) setTechs(Array.from(byTech.values()))
    }

    load()
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [selectedDate])

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

    setTechs((prev) => {
      const next = prev.map((t) => ({ ...t, jobs: [...t.jobs] }))
      const from = next.find((t) => t.id === fromTechId)
      const to = next.find((t) => t.id === toTechId)
      if (!from || !to) return prev
      const idx = from.jobs.findIndex((j) => j.id === jobId)
      if (idx < 0) return prev
      const [moved] = from.jobs.splice(idx, 1)
      to.jobs.push(moved)
      return next
    })

    await supabase.from('jobs').update({ technician_id: toTechId }).eq('id', jobId)
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
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{dateLabel}</span>
        </div>

        <div style={{ display: 'flex', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
          <button style={view === 'day' ? viewBtnActive : viewBtn} onClick={() => setView('day')}>Day</button>
          <button style={view === 'week' ? viewBtnActive : viewBtn} onClick={() => setView('week')}>Week</button>
        </div>

        <button style={addJobBtn}>+ Add job</button>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', padding: '10px 16px' }}>
          <div style={headerCell}>Technician</div>
          <div style={headerCell}>Jobs — drag to reassign</div>
        </div>

        {loading && (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>Loading…</div>
        )}
        {error && (
          <div style={{ padding: 32, textAlign: 'center', color: '#EF4444', fontSize: 13 }}>{error}</div>
        )}
        {!loading && !error && techs.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>No jobs scheduled for this day.</div>
        )}

        {!loading && techs.map((tech, idx) => {
          const { label: statusLabel, color: statusColor } = techStatus(tech.jobs)
          return (
            <div key={tech.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', minHeight: 90, borderBottom: idx === techs.length - 1 ? 'none' : '1px solid #E5E7EB' }}>
              <div style={{ padding: '14px 16px', borderRight: '1px solid #E5E7EB', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E5E7EB', color: '#6B7280', fontSize: 10, fontWeight: 600, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{tech.initials}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{tech.name}</div>
                  <div style={{ fontSize: 11, marginTop: 3, color: statusColor }}>{statusLabel}</div>
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
                      style={{ borderRadius: 8, padding: '7px 10px', minWidth: 120, border: `1px solid ${s.border}`, background: s.bg, cursor: 'grab' }}
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
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, padding: '0 2px' }}>
        <Legend color='#EFF6FF' border='#BFDBFE' label='Pending' />
        <Legend color='#F0F9FF' border='#7DD3FC' label='In progress' />
        <Legend color='#F0FDF4' border='#BBF7D0' label='Complete' />
        <Legend color='#FFF1F2' border='#FECDD3' label='Flagged reading' />
      </div>
    </div>
  )
}

function Legend({ color, border, label }: { color: string; border: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280' }}>
      <span style={{ width: 8, height: 8, borderRadius: 3, background: color, border: `1px solid ${border}` }} />
      {label}
    </div>
  )
}

const headerCell: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6B7280' }
const arrowBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#374151', cursor: 'pointer' }
const todayBtn: React.CSSProperties = { height: 32, padding: '0 14px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }
const viewBtn: React.CSSProperties = { padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#6B7280', cursor: 'pointer', border: 'none', background: 'transparent' }
const viewBtnActive: React.CSSProperties = { ...viewBtn, background: '#111827', color: '#FFFFFF' }
const addJobBtn: React.CSSProperties = { height: 32, padding: '0 16px', background: '#111827', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }
const addSlotBtn: React.CSSProperties = { border: '1px dashed #D1D5DB', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: 11, color: '#6B7280', background: 'transparent', height: 'fit-content' }

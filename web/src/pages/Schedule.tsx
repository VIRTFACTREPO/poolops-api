import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type ViewMode = 'day' | 'week'
type JobState = 'pending' | 'in_progress' | 'complete' | 'flagged'

type Job = {
  id: string
  customer: string
  address: string
  area: string
  state: JobState
  note: string
  techName: string
}

type ServiceRecord = {
  id: string
  ph: number | null
  free_chlorine: number | null
  alkalinity: number | null
  calcium_hardness: number | null
  cyanuric_acid: number | null
  lsi_score: number | null
  is_flagged: boolean
  notes: string | null
  office_note: string | null
  completed_at: string | null
}

type JobDetail = {
  job: Job
  record: ServiceRecord | null
  loading: boolean
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

type PoolOption = { id: string; label: string }
type ProfileOption = { id: string; name: string }

export default function Schedule() {
  const [view, setView] = useState<ViewMode>('day')
  const [offset, setOffset] = useState(0)
  const [techs, setTechs] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<JobDetail | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showAddJob, setShowAddJob] = useState(false)
  const [, setAddJobPreTech] = useState<string>('')
  const [pools, setPools] = useState<PoolOption[]>([])
  const [profiles, setProfiles] = useState<ProfileOption[]>([])
  const [addForm, setAddForm] = useState({ poolId: '', techId: '', date: '' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const navigate = useNavigate()

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
          address: customer?.address || '',
          area: customer?.address?.split(',').slice(-2, -1)[0]?.trim() || '',
          state: jobState(j.status, isFlagged),
          note: jobNote(j.status, isFlagged, j.completed_at),
          techName: profileMap.get(j.technician_id) || 'Unknown',
        })
      }

      if (!cancelled) setTechs(Array.from(byTech.values()))
    }

    load()
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [selectedDate, refreshKey])

  const openAddJob = async (preTechId = '') => {
    setAddJobPreTech(preTechId)
    setAddForm({ poolId: '', techId: preTechId, date: toISODate(selectedDate) })
    setAddError(null)
    setShowAddJob(true)

    const [poolsRes, profilesRes] = await Promise.all([
      supabase.from('pools').select('id, customers(first_name, last_name)'),
      supabase.from('profiles').select('id, full_name'),
    ])
    setPools((poolsRes.data || []).map((p) => {
      const c = p.customers as unknown as { first_name: string; last_name: string } | null
      return { id: p.id, label: c ? `${c.last_name}, ${c.first_name}` : p.id }
    }).sort((a, b) => a.label.localeCompare(b.label)))
    setProfiles((profilesRes.data || []).map((p) => ({ id: p.id, name: p.full_name as string })).sort((a, b) => a.name.localeCompare(b.name)))
  }

  const submitAddJob = async () => {
    if (!addForm.poolId || !addForm.techId || !addForm.date) {
      setAddError('All fields are required.')
      return
    }
    setAdding(true)
    setAddError(null)
    const maxOrder = techs.flatMap((t) => t.jobs).length
    const { error: err } = await supabase.from('jobs').insert({
      pool_id: addForm.poolId,
      technician_id: addForm.techId,
      scheduled_date: addForm.date,
      status: 'pending',
      route_order: maxOrder + 1,
    })
    setAdding(false)
    if (err) { setAddError(err.message); return }
    setShowAddJob(false)
    setRefreshKey((k) => k + 1)
  }

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

  const openDetail = async (job: Job) => {
    setDetail({ job, record: null, loading: true })
    const { data } = await supabase
      .from('service_records')
      .select('id, ph, free_chlorine, alkalinity, calcium_hardness, cyanuric_acid, lsi_score, is_flagged, notes, office_note, completed_at')
      .eq('job_id', job.id)
      .maybeSingle()
    setDetail({ job, record: data ?? null, loading: false })
  }

  return (
    <div style={{ position: 'relative' }}>
      {detail && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.25)' }}
          onClick={() => setDetail(null)}
        />
      )}
      {detail && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, zIndex: 50,
          background: '#FFFFFF', borderLeft: '1px solid #E5E7EB',
          display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        }}>
          {/* Panel header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{detail.job.customer}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{detail.job.address}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, borderRadius: 99, padding: '3px 10px',
                  background: stateStyle[detail.job.state].bg,
                  border: `1px solid ${stateStyle[detail.job.state].border}`,
                  color: stateStyle[detail.job.state].title,
                }}>
                  {detail.job.state === 'in_progress' ? 'In progress' : detail.job.state.charAt(0).toUpperCase() + detail.job.state.slice(1)}
                </span>
                <span style={{ fontSize: 11, color: '#6B7280' }}>· {detail.job.techName}</span>
              </div>
            </div>
            <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {detail.loading && <div style={{ textAlign: 'center', color: '#6B7280', fontSize: 13, paddingTop: 40 }}>Loading…</div>}

            {!detail.loading && !detail.record && (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingTop: 40 }}>No service record yet.</div>
            )}

            {!detail.loading && detail.record && (() => {
              const r = detail.record!
              const readings = [
                { label: 'pH', value: r.ph, min: 7.2, max: 7.8 },
                { label: 'Free Chlorine', value: r.free_chlorine, min: 1.0, max: 3.0 },
                { label: 'Alkalinity', value: r.alkalinity, min: 80, max: 120 },
                { label: 'Calcium Hardness', value: r.calcium_hardness, min: 200, max: 400 },
                { label: 'Cyanuric Acid', value: r.cyanuric_acid, min: 30, max: 50 },
              ]
              return (
                <>
                  {r.is_flagged && (
                    <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderLeft: '4px solid #EF4444', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>
                      ⚑ Flagged reading
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6B7280', marginBottom: 10 }}>Chemical Readings</div>
                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                      {readings.map((rd, i) => {
                        if (rd.value == null) return null
                        const inRange = rd.value >= rd.min && rd.value <= rd.max
                        return (
                          <div key={rd.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderBottom: i < readings.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                            <span style={{ fontSize: 12, color: '#374151' }}>{rd.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: inRange ? '#15803D' : '#B91C1C' }}>{rd.value}</span>
                          </div>
                        )
                      })}
                      {r.lsi_score != null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderTop: '1px solid #E5E7EB' }}>
                          <span style={{ fontSize: 12, color: '#374151' }}>LSI Score</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: Math.abs(r.lsi_score) <= 0.5 ? '#15803D' : '#B91C1C' }}>{r.lsi_score.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {r.notes && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6B7280', marginBottom: 8 }}>Tech Notes</div>
                      <div style={{ fontSize: 13, color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', lineHeight: 1.5 }}>{r.notes}</div>
                    </div>
                  )}

                  {r.office_note && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6B7280', marginBottom: 8 }}>Office Note</div>
                      <div style={{ fontSize: 13, color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', lineHeight: 1.5 }}>{r.office_note}</div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>

          {/* Panel footer */}
          {detail.record && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB' }}>
              <button
                onClick={() => navigate(`/records/${detail.record!.id}`)}
                style={{ width: '100%', background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                View full service record →
              </button>
            </div>
          )}
        </div>
      )}

      {showAddJob && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowAddJob(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: '#FFFFFF', borderRadius: 14, width: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Add job</span>
              <button onClick={() => setShowAddJob(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={formLabel}>
                Customer / Pool
                <select style={formSelect} value={addForm.poolId} onChange={(e) => setAddForm((f) => ({ ...f, poolId: e.target.value }))}>
                  <option value=''>Select a pool…</option>
                  {pools.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </label>
              <label style={formLabel}>
                Technician
                <select style={formSelect} value={addForm.techId} onChange={(e) => setAddForm((f) => ({ ...f, techId: e.target.value }))}>
                  <option value=''>Select technician…</option>
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label style={formLabel}>
                Date
                <input type='date' style={formSelect} value={addForm.date} onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))} />
              </label>
              {addError && <div style={{ fontSize: 12, color: '#B91C1C' }}>{addError}</div>}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB' }}>
              <button onClick={submitAddJob} disabled={adding} style={{ width: '100%', background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.6 : 1 }}>
                {adding ? 'Adding…' : 'Add job'}
              </button>
            </div>
          </div>
        </>
      )}

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

        <button style={addJobBtn} onClick={() => openAddJob()}>+ Add job</button>
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
                      onClick={() => openDetail(job)}
                      style={{ borderRadius: 8, padding: '7px 10px', minWidth: 120, border: `1px solid ${s.border}`, background: s.bg, cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: s.title }}>{job.customer}</div>
                      <div style={{ fontSize: 10, marginTop: 2, color: s.sub }}>{job.area}</div>
                      <div style={{ fontSize: 10, marginTop: 3, opacity: 0.6, color: '#94A3B8' }}>{job.note}</div>
                    </div>
                  )
                })}
                <button style={addSlotBtn} onClick={() => openAddJob(tech.id)}>+ Add job</button>
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
const formLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', flexDirection: 'column', gap: 6 }
const formSelect: React.CSSProperties = { fontSize: 13, color: '#111827', border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 10px', background: '#F9FAFB', outline: 'none', width: '100%' }

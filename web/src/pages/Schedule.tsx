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
  poolCount: number
  isOverdue?: boolean
}

type PoolReading = {
  ph?: { value: number; status: string }
  chlorine?: { value: number; status: string }
  alkalinity?: { value: number; status: string }
  calcium?: { value: number; status: string }
  stabiliser?: { value: number; status: string }
}

type ServiceRecord = {
  id: string
  pool_id: string
  poolType: string | null
  readings: PoolReading
  lsi_score: number | null
  is_flagged: boolean
  customer_note: string | null
  office_note: string | null
  completed_at: string | null
}

type JobDetail = {
  job: Job
  records: ServiceRecord[]
  loading: boolean
}

type Technician = {
  id: string
  initials: string
  name: string
  jobs: Job[]
}

type CustomerPool = { id: string; poolType: string; volumeLitres: number }
type CustomerOption = { id: string; name: string; pools: CustomerPool[] }
type ProfileOption = { id: string; name: string; companyId: string | null }

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

function poolTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    chlorine: 'Pool (Chlorine)',
    salt: 'Pool (Salt)',
    mineral: 'Pool (Mineral)',
    freshwater: 'Pool (Freshwater)',
    spa: 'Spa Pool',
    'spa-salt': 'Spa (Salt)',
    'spa-chlorine': 'Spa (Chlorine)',
    'spa-mineral': 'Spa (Mineral)',
    'spa-freshwater': 'Spa (Freshwater)',
  }
  return labels[type] || type
}

const stateStyle: Record<JobState, { bg: string; border: string; title: string; sub: string }> = {
  pending:     { bg: '#EFF6FF', border: '#BFDBFE',  title: '#1E40AF', sub: '#0EA5E9' },
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
  const [detail, setDetail] = useState<JobDetail | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showAddJob, setShowAddJob] = useState(false)
  const [, setAddJobPreTech] = useState<string>('')
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [profiles, setProfiles] = useState<ProfileOption[]>([])
  const [addForm, setAddForm] = useState({ customerId: '', poolIds: [] as string[], techId: '', date: '' })
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
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      const date = toISODate(selectedDate)
      const today = toISODate(new Date())
      const isToday = date === today

      const jobSelect = `id, status, completed_at, route_order, technician_id,
        job_pools ( pools ( id, pool_type, customers ( first_name, last_name, address ) ) )`

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type RawJob = Record<string, any>

      const [scheduledRes, overdueRes] = await Promise.all([
        supabase.from('jobs').select(jobSelect).eq('scheduled_date', date).order('route_order'),
        isToday
          ? supabase.from('jobs').select(jobSelect).lt('scheduled_date', today).in('status', ['pending', 'in_progress']).order('scheduled_date', { ascending: false }).order('route_order')
          : Promise.resolve({ data: [], error: null }),
      ])

      if (scheduledRes.error) throw scheduledRes.error
      if (overdueRes.error) throw overdueRes.error

      const scheduledJobs = (scheduledRes.data || []) as RawJob[]
      const overdueJobs = (overdueRes.data || []) as RawJob[]
      const overdueIds = new Set(overdueJobs.map((j) => j.id))

      const seen = new Set<string>()
      const jobs: (RawJob & { _isOverdue: boolean })[] = []
      for (const j of [...overdueJobs, ...scheduledJobs]) {
        if (seen.has(j.id)) continue
        seen.add(j.id)
        jobs.push({ ...j, _isOverdue: overdueIds.has(j.id) })
      }

      if (!jobs.length) {
        if (!cancelled) setTechs([])
        return
      }

      const techIds = [...new Set(jobs.map((j) => j.technician_id))]
      const [recordsRes, profilesRes] = await Promise.all([
        supabase.from('service_records').select('job_id, is_flagged').in('job_id', jobs.map((j) => j.id)),
        supabase.from('profiles').select('id, full_name').in('id', techIds),
      ])

      const flaggedSet = new Set((recordsRes.data || []).filter((r) => r.is_flagged).map((r) => r.job_id))
      const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p.full_name as string]))

      const byTech = new Map<string, Technician>()

      for (const j of jobs || []) {
        const techName = profileMap.get(j.technician_id) || 'Unknown'
        type RawPool = { id: string; pool_type: string; customers: { first_name: string; last_name: string; address: string } }
        const jPools = ((j.job_pools as unknown as { pools: RawPool }[]) || []).map((jp) => jp.pools).filter(Boolean)
        const firstPool = jPools?.[0]
        const customer = firstPool?.customers

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
          poolCount: jPools?.length ?? 1,
          isOverdue: j._isOverdue ?? false,
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
    setAddForm({ customerId: '', poolIds: [], techId: preTechId, date: toISODate(selectedDate) })
    setAddError(null)
    setShowAddJob(true)

    const [customersRes, profilesRes] = await Promise.all([
      supabase.from('customers').select('id, first_name, last_name, pools(id, pool_type, volume_litres)'),
      supabase.from('profiles').select('id, full_name, company_id'),
    ])

    type RawPool = { id: string; pool_type: string; volume_litres: number }
    setCustomers(
      (customersRes.data || [])
        .map((c) => ({
          id: c.id,
          name: `${(c.last_name as string)}, ${c.first_name as string}`,
          pools: ((c.pools as unknown as RawPool[]) || []).map((p) => ({
            id: p.id,
            poolType: p.pool_type,
            volumeLitres: p.volume_litres,
          })),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
    setProfiles(
      (profilesRes.data || [])
        .map((p) => ({ id: p.id, name: p.full_name as string, companyId: p.company_id as string | null }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
  }

  const onCustomerChange = (customerId: string) => {
    const c = customers.find((x) => x.id === customerId)
    setAddForm((f) => ({ ...f, customerId, poolIds: c ? c.pools.map((p) => p.id) : [] }))
  }

  const togglePool = (poolId: string, checked: boolean) => {
    setAddForm((f) => ({
      ...f,
      poolIds: checked ? [...f.poolIds, poolId] : f.poolIds.filter((id) => id !== poolId),
    }))
  }

  const submitAddJob = async () => {
    if (!addForm.customerId || addForm.poolIds.length === 0 || !addForm.techId || !addForm.date) {
      setAddError('Select a customer, at least one pool, a technician, and a date.')
      return
    }
    setAdding(true)
    setAddError(null)

    const tech = profiles.find((p) => p.id === addForm.techId)
    const companyId = tech?.companyId
    if (!companyId) { setAddError('Could not determine company for selected technician.'); setAdding(false); return }

    const maxOrder = techs.flatMap((t) => t.jobs).length

    const { data: newJob, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        technician_id: addForm.techId,
        scheduled_date: addForm.date,
        status: 'pending',
        route_order: maxOrder + 1,
        company_id: companyId,
      })
      .select('id')
      .single()

    if (jobErr) { setAddError(jobErr.message); setAdding(false); return }

    const { error: jpErr } = await supabase
      .from('job_pools')
      .insert(addForm.poolIds.map((poolId) => ({ job_id: newJob.id, pool_id: poolId })))

    setAdding(false)
    if (jpErr) { setAddError(jpErr.message); return }

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
    setDetail({ job, records: [], loading: true })
    const { data } = await supabase
      .from('service_records')
      .select('id, pool_id, readings, lsi_score, is_flagged, customer_note, office_note, completed_at, pools(pool_type)')
      .eq('job_id', job.id)
    setDetail({
      job,
      records: (data || []).map((r) => ({
        id: r.id,
        pool_id: r.pool_id,
        poolType: (r.pools as unknown as { pool_type: string } | null)?.pool_type ?? null,
        readings: r.readings as PoolReading,
        lsi_score: r.lsi_score,
        is_flagged: r.is_flagged,
        customer_note: r.customer_note,
        office_note: r.office_note,
        completed_at: r.completed_at,
      })),
      loading: false,
    })
  }

  const selectedCustomer = customers.find((c) => c.id === addForm.customerId)

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

            {!detail.loading && detail.records.length === 0 && (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingTop: 40 }}>No service record yet.</div>
            )}

            {!detail.loading && detail.records.map((r, rIdx) => {
              const readings = [
                { label: 'pH',               key: 'ph',         min: 7.2, max: 7.6 },
                { label: 'Free Chlorine',     key: 'chlorine',   min: 1.0, max: 3.0 },
                { label: 'Alkalinity',        key: 'alkalinity', min: 80,  max: 120  },
                { label: 'Calcium Hardness',  key: 'calcium',    min: 200, max: 400  },
                { label: 'Stabiliser',        key: 'stabiliser', min: 30,  max: 50   },
              ]
              return (
                <div key={r.id}>
                  {detail.records.length > 1 && (
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6B7280', marginBottom: 10 }}>
                      {poolTypeLabel(r.poolType || '')}
                    </div>
                  )}

                  {r.is_flagged && (
                    <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderLeft: '4px solid #EF4444', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#B91C1C', fontWeight: 500, marginBottom: 12 }}>
                      ⚑ Flagged reading
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6B7280', marginBottom: 10 }}>Chemical Readings</div>
                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                      {readings.map((rd, i) => {
                        const entry = r.readings[rd.key as keyof PoolReading]
                        if (!entry) return null
                        const inRange = entry.value >= rd.min && entry.value <= rd.max
                        return (
                          <div key={rd.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderBottom: i < readings.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                            <span style={{ fontSize: 12, color: '#374151' }}>{rd.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: inRange ? '#15803D' : '#B91C1C' }}>{entry.value}</span>
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

                  {r.customer_note && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6B7280', marginBottom: 8 }}>Tech Notes</div>
                      <div style={{ fontSize: 13, color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', lineHeight: 1.5 }}>{r.customer_note}</div>
                    </div>
                  )}

                  {r.office_note && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6B7280', marginBottom: 8 }}>Office Note</div>
                      <div style={{ fontSize: 13, color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', lineHeight: 1.5 }}>{r.office_note}</div>
                    </div>
                  )}

                  {rIdx < detail.records.length - 1 && (
                    <div style={{ borderBottom: '1px solid #E5E7EB', marginTop: 16 }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Panel footer */}
          {detail.records.length > 0 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB' }}>
              <button
                onClick={() => navigate(`/records/${detail.records[0].id}`)}
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
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: '#FFFFFF', borderRadius: 14, width: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Add job</span>
              <button onClick={() => setShowAddJob(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              <label style={formLabel}>
                Customer
                <select
                  style={formSelect}
                  value={addForm.customerId}
                  onChange={(e) => onCustomerChange(e.target.value)}
                >
                  <option value=''>Select a customer…</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>

              {selectedCustomer && selectedCustomer.pools.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    {selectedCustomer.pools.length === 1 ? 'Service' : 'Select to service'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedCustomer.pools.map((p) => {
                      const isSpa = p.poolType === 'spa'
                      const checked = addForm.poolIds.includes(p.id)
                      const pillBg = isSpa ? '#F5F3FF' : '#EFF6FF'
                      const pillBorder = isSpa ? '#DDD6FE' : '#BFDBFE'
                      const pillColor = isSpa ? '#6D28D9' : '#1D4ED8'
                      return (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, border: `1px solid ${checked ? (isSpa ? '#DDD6FE' : '#BFDBFE') : '#E5E7EB'}`, background: checked ? (isSpa ? '#F5F3FF' : '#EFF6FF') : '#F9FAFB', transition: 'all 0.15s' }}>
                          <input
                            type='checkbox'
                            checked={checked}
                            onChange={(e) => togglePool(p.id, e.target.checked)}
                            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: isSpa ? '#7C3AED' : '#2563EB' }}
                          />
                          <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '2px 8px', background: pillBg, border: `1px solid ${pillBorder}`, color: pillColor }}>
                            {isSpa ? 'Spa Pool' : 'Pool'}
                          </span>
                          <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{isSpa ? 'Spa Pool' : poolTypeLabel(p.poolType)}</span>
                          <span style={{ color: '#9CA3AF', fontSize: 11 }}>{p.volumeLitres.toLocaleString()}L</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: s.title }}>{job.customer}</div>
                        {job.isOverdue && (
                          <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 4, padding: '1px 5px', lineHeight: 1.4 }}>OVERDUE</span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, marginTop: 2, color: s.sub }}>{job.area}</div>
                      {job.poolCount > 1 && (
                        <div style={{ fontSize: 10, marginTop: 2, color: s.sub, opacity: 0.75 }}>Pool + Spa</div>
                      )}
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

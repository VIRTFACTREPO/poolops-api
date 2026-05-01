import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type TeamRow = { id: string; name: string; done: number; assigned: number }
type FlaggedRow = { id: string; pool: string; reading: string; value: string; range: string; time: string }
type ActivityRow = { id: string; text: string; time: string; flagged: boolean }

const quickActions = [
  { id: 'add-job',       label: 'Add Job',       hint: 'Create a new service job',   path: '/schedule' },
  { id: 'add-customer',  label: 'Add Customer',  hint: 'Add a new customer profile', path: '/customers/new' },
  { id: 'view-schedule', label: 'View Schedule', hint: "See today's route plan",      path: '/schedule' },
  { id: 'view-inbox',    label: 'View Inbox',    hint: 'Review incoming requests',    path: '/inbox' },
]

const READING_META: Record<string, { label: string; min: number; max: number }> = {
  ph:         { label: 'pH',               min: 7.2, max: 7.6 },
  chlorine:   { label: 'Free Chlorine',    min: 1.0, max: 3.0 },
  alkalinity: { label: 'Alkalinity',       min: 80,  max: 120 },
  calcium:    { label: 'Calcium Hardness', min: 200, max: 400 },
  stabiliser: { label: 'Stabiliser',       min: 30,  max: 50  },
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [jobsToday, setJobsToday] = useState(0)
  const [flaggedCount, setFlaggedCount] = useState(0)
  const [teamProgress, setTeamProgress] = useState<TeamRow[]>([])
  const [flaggedReadings, setFlaggedReadings] = useState<FlaggedRow[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const today = todayLocal()

    async function load() {
      const [
        { count: jobCount },
        { count: flagCount },
        { data: profiles },
        { data: todayJobs },
        { data: flaggedRecs },
        { data: recentRecs },
      ] = await Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('scheduled_date', today),
        supabase.from('service_records').select('*', { count: 'exact', head: true }).eq('is_flagged', true),
        supabase.from('profiles').select('id, full_name'),
        supabase.from('jobs').select('technician_id, status').eq('scheduled_date', today),
        supabase
          .from('service_records')
          .select('id, completed_at, readings, flagged_readings, customers(first_name, last_name)')
          .eq('is_flagged', true)
          .order('completed_at', { ascending: false })
          .limit(5),
        supabase
          .from('service_records')
          .select('id, ref, completed_at, is_flagged, customers(first_name, last_name)')
          .order('completed_at', { ascending: false })
          .limit(8),
      ])

      if (!active) return

      setJobsToday(jobCount ?? 0)
      setFlaggedCount(flagCount ?? 0)

      if (profiles && todayJobs) {
        const profileMap = new Map((profiles as any[]).map((p) => [p.id, p.full_name as string]))
        const byTech = new Map<string, { done: number; assigned: number }>()
        for (const j of todayJobs as any[]) {
          if (!j.technician_id) continue
          const cur = byTech.get(j.technician_id) ?? { done: 0, assigned: 0 }
          cur.assigned++
          if (j.status === 'complete') cur.done++
          byTech.set(j.technician_id, cur)
        }
        setTeamProgress(
          Array.from(byTech.entries())
            .map(([id, counts]) => ({ id, name: profileMap.get(id) ?? 'Unknown', ...counts }))
            .sort((a, b) => b.assigned - a.assigned),
        )
      }

      if (flaggedRecs) {
        const rows: FlaggedRow[] = (flaggedRecs as any[]).flatMap((rec) => {
          const flagged: string[] = rec.flagged_readings ?? []
          const c = rec.customers
          const pool = c ? `${c.last_name}, ${c.first_name}` : 'Unknown'
          return flagged.slice(0, 1).map((key) => {
            const meta = READING_META[key]
            const entry = rec.readings?.[key]
            return {
              id: `${rec.id}-${key}`,
              pool,
              reading: meta?.label ?? key,
              value: String(entry?.value ?? '—'),
              range: meta ? `${meta.min} – ${meta.max}` : '—',
              time: relativeTime(rec.completed_at),
            }
          })
        })
        setFlaggedReadings(rows)
      }

      if (recentRecs) {
        setActivity(
          (recentRecs as any[]).map((rec) => {
            const c = rec.customers
            const who = c ? `${c.last_name}, ${c.first_name}` : 'Unknown customer'
            return {
              id: rec.id,
              text: `${rec.ref ?? 'Record'} completed · ${who}`,
              time: relativeTime(rec.completed_at),
              flagged: rec.is_flagged,
            }
          }),
        )
      }

      setLoading(false)
    }

    load().catch(() => setLoading(false))
    return () => { active = false }
  }, [])

  const greeting = useMemo(() => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Good morning'
    if (hr < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={{ display: 'grid', gap: 6 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{greeting}, Simon</h1>
        <p style={{ fontSize: 13, color: '#6B7280' }}>Here's your live operations snapshot.</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => navigate(action.path)}
            style={{ textAlign: 'left', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 14px', color: '#111827', cursor: 'pointer' }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>{action.label}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#6B7280' }}>{action.hint}</div>
          </button>
        ))}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#FFFFFF' }}>
        <StatCell label='Jobs Today' value={jobsToday} />
        <StatCell label='Flagged Readings' value={flaggedCount} highlight withBorder />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card title='Team Progress'>
          {loading ? (
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>Loading…</div>
          ) : teamProgress.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>No jobs scheduled today.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {teamProgress.map((row) => {
                const pct = row.assigned > 0 ? Math.round((row.done / row.assigned) * 100) : 0
                return (
                  <div key={row.id} style={{ display: 'grid', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#374151' }}>{row.name}</span>
                      <span style={{ color: '#6B7280' }}>{row.done}/{row.assigned}</span>
                    </div>
                    <div style={{ height: 8, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#22C55E' : '#0EA5E9' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card title='Flagged Readings'>
          {loading ? (
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>Loading…</div>
          ) : flaggedReadings.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>No flagged readings.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {flaggedReadings.map((row) => (
                <div key={row.id} style={{ display: 'grid', gap: 3, border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: 10, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#DC2626', fontWeight: 600 }}>{row.pool}</span>
                    <span style={{ color: '#6B7280' }}>{row.time}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#111827' }}>
                    {row.reading}: <strong>{row.value}</strong>{' '}
                    <span style={{ color: '#6B7280' }}>(target {row.range})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section>
        <Card title='Recent Activity'>
          {loading ? (
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>Loading…</div>
          ) : activity.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>No recent activity.</div>
          ) : (
            <div style={{ display: 'grid', gap: 0 }}>
              {activity.map((row, i) => (
                <div
                  key={row.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 13,
                    padding: '9px 0',
                    borderBottom: i < activity.length - 1 ? '1px solid #F3F4F6' : undefined,
                  }}
                >
                  <span style={{ color: '#374151' }}>
                    {row.flagged && <span style={{ color: '#DC2626', marginRight: 6 }}>⚑</span>}
                    {row.text}
                  </span>
                  <span style={{ color: '#9CA3AF', whiteSpace: 'nowrap', fontSize: 12 }}>{row.time}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 14 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  )
}

function StatCell({ label, value, withBorder, highlight }: { label: string; value: number; withBorder?: boolean; highlight?: boolean }) {
  return (
    <div style={{ padding: '14px 16px', borderLeft: withBorder ? '1px solid #E5E7EB' : undefined }}>
      <div style={{ fontSize: 12, color: '#6B7280' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: highlight ? '#EF4444' : '#111827', marginTop: 4 }}>{value}</div>
    </div>
  )
}

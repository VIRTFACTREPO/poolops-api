import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Tech = {
  id: string
  name: string
  initials: string
  color: string
  done: number
  assigned: number
  currentJob?: string
}

const COLORS = ['#38BDF8', '#A78BFA', '#4ADE80', '#F59E0B', '#F87171', '#22D3EE', '#FB923C', '#818CF8']

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Team() {
  const [team, setTeam] = useState<Tech[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = todayLocal()
    async function load() {
      const [{ data: profiles }, { data: jobs }] = await Promise.all([
        supabase.from('profiles').select('id, full_name'),
        supabase
          .from('jobs')
          .select('technician_id, status, job_pools(pools(customers(first_name, last_name, address)))')
          .eq('scheduled_date', today),
      ])

      if (!profiles) { setLoading(false); return }

      const byTech = new Map<string, { done: number; assigned: number; activeJob?: string }>()
      for (const j of (jobs ?? []) as any[]) {
        const tid = j.technician_id
        if (!tid) continue
        const cur = byTech.get(tid) ?? { done: 0, assigned: 0 }
        cur.assigned++
        if (j.status === 'complete') cur.done++
        if (j.status === 'in_progress' && !cur.activeJob) {
          const pool = (j.job_pools ?? [])[0]?.pools
          const c = pool?.customers
          cur.activeJob = c ? `${c.last_name}, ${c.first_name} · ${c.address}` : 'Active job'
        }
        byTech.set(tid, cur)
      }

      setTeam(
        (profiles as any[]).map((p, idx) => {
          const counts = byTech.get(p.id) ?? { done: 0, assigned: 0 }
          return {
            id: p.id,
            name: p.full_name as string,
            initials: initials(p.full_name as string),
            color: COLORS[idx % COLORS.length],
            done: counts.done,
            assigned: counts.assigned,
            currentJob: counts.activeJob,
          }
        }),
      )
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [])

  const totals = {
    technicians: team.length,
    onRoute: team.filter((t) => t.currentJob).length,
    completed: team.reduce((a, t) => a + t.done, 0),
    assigned: team.reduce((a, t) => a + t.assigned, 0),
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>Loading…</div>

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Team</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        <Stat title='Technicians' value={totals.technicians} />
        <Stat title='On route now' value={totals.onRoute} accent='#38BDF8' />
        <Stat title='Jobs completed' value={totals.completed} accent='#4ADE80' />
        <Stat title='Assigned today' value={totals.assigned} />
      </div>

      {team.length === 0 ? (
        <div style={{ fontSize: 13, color: '#9CA3AF', padding: 20 }}>No team members found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
          {team.map((p) => {
            const pct = p.assigned > 0 ? Math.round((p.done / p.assigned) * 100) : 0
            return (
              <div key={p.id} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${p.color}22`, color: p.color, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>
                    {p.initials}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.name}</div>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: '#6B7280' }}>Progress {p.done}/{p.assigned}</div>
                <div style={{ marginTop: 6, height: 8, borderRadius: 99, background: '#E5E7EB', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: p.color }} />
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: p.currentJob ? '#0369A1' : '#6B7280' }}>
                  {p.currentJob ? `● Live: ${p.currentJob}` : '✓ No active job'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ title, value, accent }: { title: string; value: number; accent?: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6B7280' }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 22, fontWeight: 700, color: accent || '#111827' }}>{value}</div>
    </div>
  )
}

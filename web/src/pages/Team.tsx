import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { getUser, getToken } from '../lib/auth'

function getCompanyId(): string {
  let id = getUser()?.companyId
  if (!id) {
    const token = getToken()
    if (token) { try { id = JSON.parse(atob(token.split('.')[1]))?.company_id } catch { /* ignore */ } }
  }
  return id ?? ''
}

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
  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadTeam = async () => {
    const today = todayLocal()
    const companyId = getCompanyId()
    const [{ data: profiles }, { data: jobs }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('company_id', companyId).eq('role', 'technician'),
      supabase
        .from('jobs')
        .select('technician_id, status, job_pools(pools(customers(first_name, last_name, address)))')
        .eq('scheduled_date', today)
        .eq('company_id', companyId),
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

  useEffect(() => { loadTeam().catch(() => setLoading(false)) }, [])

  const totals = {
    technicians: team.length,
    onRoute: team.filter((t) => t.currentJob).length,
    completed: team.reduce((a, t) => a + t.done, 0),
    assigned: team.reduce((a, t) => a + t.assigned, 0),
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const handleDelete = async (tech: Tech) => {
    if (!window.confirm(`Remove ${tech.name} from your team? This cannot be undone.`)) return
    setDeletingId(tech.id)
    try {
      await api.delete(`/admin/technicians/${tech.id}`)
      showToast(`${tech.name} removed`)
      await loadTeam()
    } catch (err: any) {
      showToast(`Failed to remove: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) { setInviteError('Name and email are required'); return }
    setInviting(true)
    setInviteError(null)
    try {
      await api.post('/admin/invite', { email: inviteEmail.trim(), fullName: inviteName.trim(), role: 'technician' })
      setInviteName('')
      setInviteEmail('')
      setShowInvite(false)
      showToast(`Invite sent to ${inviteEmail.trim()}`)
      await loadTeam()
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>Loading…</div>

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, background: '#111827', color: '#F9FAFB', borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
          ✓ {toast}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Team</h1>
        <button
          onClick={() => { setShowInvite(true); setInviteError(null) }}
          style={{ background: '#111827', color: '#F9FAFB', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          + Invite technician
        </button>
      </div>

      {showInvite && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Invite a technician</div>
          <>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  placeholder='Full name'
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder='Email address'
                  type='email'
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
              {inviteError && <div style={{ fontSize: 12, color: '#EF4444' }}>{inviteError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleInvite} disabled={inviting} style={{ background: '#111827', color: '#F9FAFB', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: inviting ? 0.6 : 1 }}>
                  {inviting ? 'Sending…' : 'Send invite'}
                </button>
                <button onClick={() => setShowInvite(false)} style={{ background: 'transparent', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </>
        </div>
      )}

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
            const allPending = p.assigned > 0 && p.done === 0
            return (
              <div key={p.id} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${p.color}22`, color: p.color, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>
                    {p.initials}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1 }}>{p.name}</div>
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={deletingId === p.id}
                    title='Remove technician'
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, padding: '2px 4px', lineHeight: 1, opacity: deletingId === p.id ? 0.4 : 1 }}
                  >×</button>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: allPending ? '#D97706' : '#6B7280' }}>
                  Progress {p.done}/{p.assigned}{allPending ? ' – pending' : ''}
                </div>
                <div style={{ marginTop: 6, height: 8, borderRadius: 99, background: '#E5E7EB', overflow: 'hidden', position: 'relative' }}>
                  {p.assigned > 0 && (
                    <div style={{ position: 'absolute', inset: 0, background: `${p.color}33` }} />
                  )}
                  <div style={{ position: 'absolute', width: `${pct}%`, height: '100%', background: p.color }} />
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

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: '#F9FAFB',
  border: '1px solid #D1D5DB',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  color: '#111827',
}

function Stat({ title, value, accent }: { title: string; value: number; accent?: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6B7280' }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 22, fontWeight: 700, color: accent || '#111827' }}>{value}</div>
    </div>
  )
}

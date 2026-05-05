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

type TechDetail = {
  id: string
  name: string
  email: string | null
  phone: string | null
  today: {
    assigned: number
    completed: number
    jobs: { id: string; status: string; customer: string | null; address: string | null }[]
  }
  assignments: {
    id: string
    frequency: string
    dayOfWeek: string | null
    customer: string | null
    customerNumber: number | null
    address: string | null
  }[]
  recentRecords: {
    id: string
    completedAt: string
    isFlagged: boolean
    customer: string | null
    address: string | null
  }[]
}

const COLORS = ['#38BDF8', '#A78BFA', '#4ADE80', '#F59E0B', '#F87171', '#22D3EE', '#FB923C', '#818CF8']

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
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
  const [selectedTech, setSelectedTech] = useState<Tech | null>(null)
  const [detail, setDetail] = useState<TechDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [isEditingDetail, setIsEditingDetail] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [savingDetail, setSavingDetail] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

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

  const openDetail = async (tech: Tech) => {
    setSelectedTech(tech)
    setDetail(null)
    setDetailLoading(true)
    try {
      const data = await api.get<TechDetail>(`/admin/technicians/${tech.id}`)
      setDetail(data)
      setIsEditingDetail(false)
      setEditName(data.name ?? '')
      setEditEmail(data.email ?? '')
      setEditPhone(data.phone ?? '')
      setEditError(null)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setSelectedTech(null)
    setDetail(null)
    setIsEditingDetail(false)
    setEditError(null)
  }

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
      if (selectedTech?.id === tech.id) closeDetail()
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


  const handleCancelEdit = () => {
    if (!detail) return
    setEditName(detail.name ?? '')
    setEditEmail(detail.email ?? '')
    setEditPhone(detail.phone ?? '')
    setEditError(null)
    setIsEditingDetail(false)
  }

  const handleSaveDetail = async () => {
    if (!selectedTech || !detail) return
    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Name and email are required')
      return
    }

    setSavingDetail(true)
    setEditError(null)
    try {
      const updated = await api.patch<{ id: string; name: string; email: string; phone: string | null }>(`/admin/technicians/${selectedTech.id}`, {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      })

      const nextDetail: TechDetail = {
        ...detail,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
      }
      setDetail(nextDetail)
      setSelectedTech({ ...selectedTech, name: updated.name, initials: initials(updated.name) })
      setTeam((prev) => prev.map((t) => t.id === selectedTech.id ? { ...t, name: updated.name, initials: initials(updated.name) } : t))
      setIsEditingDetail(false)
      showToast('Technician details updated')
    } catch (err: any) {
      setEditError(err.message || 'Failed to update technician')
    } finally {
      setSavingDetail(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>Loading…</div>

  const selectedColor = selectedTech ? selectedTech.color : '#38BDF8'

  return (
    <div style={{ display: 'grid', gap: 14, position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: selectedTech ? 380 : 20, zIndex: 1100, background: '#111827', color: '#F9FAFB', borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', transition: 'right 0.3s' }}>
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
          <div style={{ display: 'flex', gap: 10 }}>
            <input placeholder='Full name' value={inviteName} onChange={e => setInviteName(e.target.value)} style={inputStyle} />
            <input placeholder='Email address' type='email' value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={inputStyle} />
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
            const allPending = p.assigned > 0 && p.done === 0 && !p.currentJob
            const isSelected = selectedTech?.id === p.id
            return (
              <div
                key={p.id}
                onClick={() => isSelected ? closeDetail() : openDetail(p)}
                style={{ background: '#FFFFFF', border: `1.5px solid ${isSelected ? p.color : '#E5E7EB'}`, borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'border-color 0.15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${p.color}22`, color: p.color, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {p.initials}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1 }}>{p.name}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p) }}
                    disabled={deletingId === p.id}
                    title='Remove technician'
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, padding: '2px 4px', lineHeight: 1, opacity: deletingId === p.id ? 0.4 : 1 }}
                  >×</button>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: allPending ? '#D97706' : p.currentJob ? '#0369A1' : '#6B7280' }}>
                  Progress {p.done}/{p.assigned}{allPending ? ' – pending' : p.currentJob ? ' – in progress' : ''}
                </div>
                <div style={{ marginTop: 6, height: 8, borderRadius: 99, background: '#E5E7EB', overflow: 'hidden', position: 'relative' }}>
                  {p.assigned > 0 && <div style={{ position: 'absolute', inset: 0, background: `${p.color}33` }} />}
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

      {/* Slide-out drawer overlay */}
      {selectedTech && (
        <>
          <div
            onClick={closeDetail}
            style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.18)' }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 950,
            width: 360, background: '#FFFFFF',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.10)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.22s ease',
          }}>
            <style>{`@keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>

            {/* Drawer header */}
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${selectedColor}22`, color: selectedColor, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {initials(isEditingDetail ? editName || selectedTech.name : selectedTech.name)}
                </div>
                <div style={{ flex: 1 }}>
                  {isEditingDetail ? (
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ ...inputStyle, width: '100%', background: '#FFFFFF' }} placeholder='Full name' />
                  ) : (
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{detail?.name ?? selectedTech.name}</div>
                  )}
                  {isEditingDetail ? (
                    <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                      <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ ...inputStyle, width: '100%', background: '#FFFFFF' }} placeholder='Email address' type='email' />
                      <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ ...inputStyle, width: '100%', background: '#FFFFFF' }} placeholder='Phone number' />
                    </div>
                  ) : (
                    <>
                      {detail?.email && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{detail.email}</div>}
                      {detail?.phone && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{detail.phone}</div>}
                    </>
                  )}
                </div>
                {!isEditingDetail && detail && (
                  <button
                    onClick={() => { setIsEditingDetail(true); setEditError(null) }}
                    style={{ background: 'transparent', border: '1px solid #D1D5DB', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                )}
                <button onClick={closeDetail} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 20, padding: 4, lineHeight: 1 }}>×</button>
              </div>
              {isEditingDetail && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={handleSaveDetail} disabled={savingDetail} style={{ background: '#111827', color: '#F9FAFB', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: savingDetail ? 0.6 : 1 }}>
                    {savingDetail ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={handleCancelEdit} disabled={savingDetail} style={{ background: 'transparent', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              )}
              {editError && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 8 }}>{editError}</div>}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: 20 }}>Loading…</div>
              ) : detail ? (
                <>
                  {/* Today's progress */}
                  <Section title="Today's jobs">
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <MiniStat label='Assigned' value={detail.today.assigned} />
                      <MiniStat label='Completed' value={detail.today.completed} accent='#4ADE80' />
                    </div>
                    {detail.today.jobs.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>No jobs scheduled today</div>
                    ) : detail.today.jobs.map((j) => (
                      <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <StatusDot status={j.status} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.customer ?? '—'}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.address ?? ''}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: statusColor(j.status), background: statusBg(j.status), borderRadius: 20, padding: '2px 7px', flexShrink: 0 }}>{capitalize(j.status)}</span>
                      </div>
                    ))}
                  </Section>

                  {/* Service plan assignments */}
                  <Section title={`Assigned pools (${detail.assignments.length})`}>
                    {detail.assignments.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>No pools assigned</div>
                    ) : detail.assignments.map((a) => (
                      <div key={a.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #F3F4F6' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>
                          {a.customerNumber ? `#${a.customerNumber} · ` : ''}{a.customer ?? '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{a.address ?? ''}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                          {capitalize(a.frequency ?? '')}{a.dayOfWeek ? ` · ${capitalize(a.dayOfWeek)}` : ''}
                        </div>
                      </div>
                    ))}
                  </Section>

                  {/* Recent service records */}
                  <Section title='Recent activity'>
                    {detail.recentRecords.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>No service records yet</div>
                    ) : detail.recentRecords.map((r) => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: r.isFlagged ? '#F59E0B' : '#4ADE80', marginTop: 4, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customer ?? '—'}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{daysAgo(r.completedAt)}{r.isFlagged ? ' · LSI flag' : ''}</div>
                        </div>
                      </div>
                    ))}
                  </Section>
                </>
              ) : (
                <div style={{ fontSize: 12, color: '#EF4444', textAlign: 'center' }}>Failed to load details</div>
              )}
            </div>

            {/* Drawer footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #F3F4F6' }}>
              <button
                onClick={() => handleDelete(selectedTech)}
                disabled={deletingId === selectedTech.id}
                style={{ width: '100%', background: 'none', border: '1px solid #FCA5A5', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, color: '#EF4444', cursor: 'pointer', opacity: deletingId === selectedTech.id ? 0.5 : 1 }}
              >
                {deletingId === selectedTech.id ? 'Removing…' : 'Remove from team'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#9CA3AF', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent || '#111827', marginTop: 2 }}>{value}</div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  return <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(status), marginTop: 6, flexShrink: 0 }} />
}

function statusColor(status: string) {
  if (status === 'complete') return '#4ADE80'
  if (status === 'in_progress') return '#38BDF8'
  return '#D1D5DB'
}

function statusBg(status: string) {
  if (status === 'complete') return '#F0FDF4'
  if (status === 'in_progress') return '#EFF6FF'
  return '#F9FAFB'
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

import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type InboxType = 'booking_request' | 'flagged_reading'

type Customer = { id: string; first_name: string; last_name: string; address: string }
type Booking = { id: string; reason: string; description: string | null; photo_url: string | null; status: string; pool_id: string }
type Record_ = { id: string; readings: Record<string, { value: number; status: string }> | null; completed_at: string; technician_id: string }

type InboxItem = {
  id: string
  type: InboxType
  resolved: boolean
  status?: string
  created_at: string
  reference_id: string
  customer: Customer
  booking?: Booking
  record?: Record_
}

type FilterType = 'all' | 'booking_request' | 'flagged_reading'

export default function Inbox() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    api.get<InboxItem[]>('/admin/inbox')
      .then(data => {
        setItems(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(i => {
    if (filter === 'all') return true
    return i.type === filter
  })

  const selected = filtered.find(i => i.id === selectedId) ?? filtered[0] ?? null
  const actionCount = items.filter(i => !i.resolved).length

  const markResolved = async (id: string, status?: string) => {
    await api.patch(`/admin/inbox/${id}`, { resolved: true })
    setItems(prev => prev.map(i => i.id === id ? { ...i, resolved: true, ...(status ? { status } : {}) } : i))
  }

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px', marginBottom: 20 }}>
        Inbox{' '}
        {!loading && (
          <span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280', marginLeft: 6 }}>
            {actionCount > 0 ? `${actionCount} item${actionCount !== 1 ? 's' : ''} need action` : 'All clear'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['all', 'booking_request', 'flagged_reading'] as FilterType[]).map(f => (
          <button key={f} style={filter === f ? activeTab : tabStyle} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'booking_request' ? 'Booking requests' : 'Flagged readings'}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: '#9CA3AF', fontSize: 13 }}>Loading…</div>}
      {error && <div style={{ color: '#EF4444', fontSize: 13 }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, minHeight: 'calc(100vh - 220px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ color: '#9CA3AF', fontSize: 13, padding: 16 }}>No inbox items.</div>
            )}
            {filtered.map(item => {
              const isSelected = selected?.id === item.id
              const isFlagged = item.type === 'flagged_reading'
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    textAlign: 'left',
                    background: isSelected ? '#F0F9FF' : '#FFFFFF',
                    border: `1px solid ${isSelected ? '#93C5FD' : '#E5E7EB'}`,
                    borderLeft: !item.resolved ? `3px solid ${isFlagged ? '#F59E0B' : '#38BDF8'}` : undefined,
                    borderRadius: 12,
                    padding: 14,
                    cursor: 'pointer',
                    opacity: item.resolved ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={pillFor(item.type, item.resolved)}>{pillLabel(item.type, item.resolved)}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>{timeAgo(item.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                    {item.customer.last_name}, {item.customer.first_name}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.45, marginTop: 6 }}>
                    {item.type === 'booking_request'
                      ? item.booking?.description ?? item.booking?.reason ?? '—'
                      : summariseFlagged(item.record)}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>{item.customer.address}</div>
                </button>
              )
            })}
          </div>

          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14,
            padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto',
          }}>
            {!selected
              ? <div style={{ color: '#9CA3AF' }}>Select an inbox item</div>
              : selected.type === 'booking_request'
                ? <BookingDetail item={selected} onResolve={markResolved} />
                : <FlaggedDetail item={selected} onResolve={markResolved} />
            }
          </div>
        </div>
      )}
    </div>
  )
}

function BookingDetail({ item, onResolve }: { item: InboxItem; onResolve: (id: string, status?: string) => Promise<void> }) {
  const customerName = `${item.customer.last_name}, ${item.customer.first_name}`
  const [showConfirmForm, setShowConfirmForm] = useState(false)
  const [techs, setTechs] = useState<Array<{ id: string; full_name: string }>>([])
  const [techId, setTechId] = useState('')
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    let active = true
    api.get<Array<{ id: string; full_name: string }>>('/admin/technicians')
      .then((rows) => {
        if (!active) return
        setTechs(rows || [])
        if (rows?.[0]?.id) setTechId(rows[0].id)
      })
      .catch(async () => {
        try {
          const today = new Date().toISOString().slice(0, 10)
          const rows = await api.get<Array<{ id: string; full_name: string }>>(`/admin/schedule/day?date=${today}`)
          if (!active) return
          setTechs(rows || [])
          if (rows?.[0]?.id) setTechId(rows[0].id)
        } catch {
          if (!active) return
          setTechs([])
        }
      })
    return () => { active = false }
  }, [])

  const confirmVisit = async () => {
    if (!techId || !scheduledDate) { setErrMsg('Select a technician and date.'); return }
    setSubmitting(true)
    setErrMsg('')
    setSuccessMsg('')
    try {
      await api.post(`/admin/inbox/${item.id}/confirm-visit`, { technicianId: techId, scheduledDate })
      await onResolve(item.id, 'confirmed')
      setSuccessMsg('Visit scheduled')
      setShowConfirmForm(false)
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Failed to schedule visit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{customerName} — Booking Request</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            {item.customer.address} · Submitted {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {item.booking?.description && (
        <>
          <SectionLabel>Customer message</SectionLabel>
          <div style={{ background: '#F0F9FF', borderLeft: '3px solid #38BDF8', borderRadius: '0 8px 8px 0', padding: '10px 14px', color: '#374151', fontSize: 13, fontStyle: 'italic' }}>
            "{item.booking.description}"
          </div>
        </>
      )}

      <SectionLabel>Request type</SectionLabel>
      <div style={{ fontSize: 13, color: '#374151' }}>{item.booking?.reason?.replace(/_/g, ' ') ?? '—'}</div>

      {!item.resolved && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...confirmBtn, width: 'auto', flex: 1, background: '#111827' }} onClick={() => setShowConfirmForm((v) => !v)}>
              Confirm Visit
            </button>
            <button style={{ ...confirmBtn, width: 'auto', flex: 1, background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB' }} onClick={() => onResolve(item.id)}>
              Dismiss
            </button>
          </div>

          {showConfirmForm && (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 12, color: '#374151', display: 'flex', flexDirection: 'column', gap: 6 }}>
                Technician
                <select value={techId} onChange={(e) => setTechId(e.target.value)} style={{ border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
                  <option value="">Select technician</option>
                  {techs.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 12, color: '#374151', display: 'flex', flexDirection: 'column', gap: 6 }}>
                Date
                <input type='date' value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} style={{ border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 10px', fontSize: 13 }} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...confirmBtn, width: 'auto', flex: 1 }} onClick={confirmVisit} disabled={submitting}>{submitting ? 'Confirming…' : 'Confirm'}</button>
                <button style={{ ...confirmBtn, width: 'auto', flex: 1, background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB' }} onClick={() => { setShowConfirmForm(false); setErrMsg('') }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {successMsg && <div style={{ fontSize: 12, color: '#16A34A' }}>{successMsg}</div>}
          {errMsg && <div style={{ fontSize: 12, color: '#DC2626' }}>{errMsg}</div>}
        </div>
      )}
    </>
  )
}

function FlaggedDetail({ item, onResolve }: { item: InboxItem; onResolve: (id: string, status?: string) => Promise<void> }) {
  const customerName = `${item.customer.last_name}, ${item.customer.first_name}`
  const readings = item.record?.readings ?? {}
  const flaggedReadings = Object.entries(readings).filter(([, v]) => v.status !== 'good' && v.status !== 'ok')

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{customerName} — Flagged Reading</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{item.customer.address}</div>
        </div>
        <span style={{ ...pillFor('flagged_reading', false), alignSelf: 'flex-start' }}>Flagged reading</span>
      </div>

      {flaggedReadings.length > 0 && (
        <>
          <SectionLabel>Flagged values</SectionLabel>
          <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 12 }}>
            {flaggedReadings.map(([key, val]) => (
              <div key={key} style={{ fontSize: 13, color: '#B91C1C', marginBottom: 4 }}>
                <strong>{key.toUpperCase()}</strong>: {val.value} — {val.status}
              </div>
            ))}
          </div>
        </>
      )}

      <SectionLabel>All readings</SectionLabel>
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px' }}>
        {Object.entries(readings).map(([key, val]) => (
          <MetaRow key={key} k={key.toUpperCase()} v={`${val.value} — ${val.status}`} good={val.status === 'good' || val.status === 'ok'} />
        ))}
        {item.record?.completed_at && (
          <MetaRow k='Recorded at' v={new Date(item.record.completed_at).toLocaleString()} />
        )}
      </div>

      {!item.resolved && (
        <button style={confirmBtn} onClick={() => onResolve(item.id)}>Mark as reviewed</button>
      )}
    </>
  )
}

function summariseFlagged(record: Record_ | null | undefined): string {
  if (!record?.readings) return 'Flagged reading'
  const flagged = Object.entries(record.readings).filter(([, v]) => v.status !== 'good' && v.status !== 'ok')
  if (flagged.length === 0) return 'Reading flagged for review'
  return flagged.map(([k, v]) => `${k.toUpperCase()} ${v.status.toUpperCase()} — ${v.value}`).join(', ')
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function pillLabel(type: InboxType, resolved: boolean) {
  if (resolved) return 'Resolved'
  return type === 'booking_request' ? 'Booking request' : 'Flagged reading'
}

function pillFor(type: InboxType, resolved: boolean): React.CSSProperties {
  if (resolved) return { ...pillBase, background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }
  if (type === 'booking_request') return { ...pillBase, background: '#E0F2FE', color: '#0284C7' }
  return { ...pillBase, background: '#FEF3C7', color: '#D97706' }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#9CA3AF' }}>{children}</div>
}

function MetaRow({ k, v, good }: { k: string; v: string; good?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ fontSize: 12, color: '#6B7280' }}>{k}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: good ? '#16A34A' : '#374151' }}>{v}</span>
    </div>
  )
}

const pillBase: React.CSSProperties = { fontSize: 10, fontWeight: 600, borderRadius: 20, padding: '3px 9px' }

const tabStyle: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', border: '1px solid #E5E7EB', background: '#F3F4F6', color: '#6B7280',
}

const activeTab: React.CSSProperties = {
  ...tabStyle, background: '#111827', color: '#F9FAFB', borderColor: '#111827',
}

const confirmBtn: React.CSSProperties = {
  width: '100%', background: '#111827', color: '#F9FAFB', border: 'none',
  borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer',
}

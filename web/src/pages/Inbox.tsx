import { useMemo, useState } from 'react'

type InboxType = 'booking' | 'flagged' | 'resolved'
type InboxFilter = 'all' | 'booking' | 'flagged'

type InboxItem = {
  id: string
  type: InboxType
  unread?: boolean
  time: string
  customer: string
  summary: string
  meta: string
}

const items: InboxItem[] = [
  {
    id: 'i1',
    type: 'booking',
    unread: true,
    time: '32 min ago',
    customer: 'Williams, Sarah',
    summary: 'Pool looks cloudy after the storm last night. Can someone come today?',
    meta: 'Last service: 5 days ago · pH 7.4 · Cl 1.8',
  },
  {
    id: 'i2',
    type: 'flagged',
    unread: true,
    time: '1 hr ago',
    customer: 'Smith, David',
    summary: 'Chlorine LOW — 0.8ppm recorded by James T. at 9:42am',
    meta: '12 Remuera Rd · Remuera',
  },
  {
    id: 'i3',
    type: 'resolved',
    time: 'Yesterday',
    customer: 'Chen, Michael',
    summary: 'LSI water balance flagged — reviewed and marked OK.',
    meta: '8 Mt Eden Rd · Mt Eden',
  },
]

const tabStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid #E5E7EB',
  background: '#F3F4F6',
  color: '#6B7280',
}

const activeTab: React.CSSProperties = {
  ...tabStyle,
  background: '#111827',
  color: '#F9FAFB',
  borderColor: '#111827',
}

export default function Inbox() {
  const [filter, setFilter] = useState<InboxFilter>('all')
  const [selectedId, setSelectedId] = useState('i1')

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'booking') return items.filter((i) => i.type === 'booking')
    return items.filter((i) => i.type === 'flagged')
  }, [filter])

  const selected = filtered.find((i) => i.id === selectedId) ?? filtered[0]

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px', marginBottom: 20 }}>
        Inbox <span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280', marginLeft: 6 }}>2 items need action</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button style={filter === 'all' ? activeTab : tabStyle} onClick={() => setFilter('all')}>All</button>
        <button style={filter === 'booking' ? activeTab : tabStyle} onClick={() => setFilter('booking')}>Booking requests</button>
        <button style={filter === 'flagged' ? activeTab : tabStyle} onClick={() => setFilter('flagged')}>Flagged readings</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, minHeight: 'calc(100vh - 220px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
          {filtered.map((item) => {
            const selectedCard = selected?.id === item.id
            const flagged = item.type === 'flagged'
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  textAlign: 'left',
                  background: selectedCard ? '#F0F9FF' : '#FFFFFF',
                  border: `1px solid ${selectedCard ? '#93C5FD' : '#E5E7EB'}`,
                  borderLeft: item.unread ? `3px solid ${flagged ? '#F59E0B' : '#38BDF8'}` : undefined,
                  borderRadius: 12,
                  padding: 14,
                  cursor: 'pointer',
                  opacity: item.type === 'resolved' ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={pillFor(item.type)}>{pillLabel(item.type)}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>{item.time}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.customer}</div>
                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.45, marginTop: 6 }}>{item.summary}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>{item.meta}</div>
              </button>
            )
          })}
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 14,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflowY: 'auto',
          }}
        >
          {!selected ? (
            <div style={{ color: '#9CA3AF' }}>Select an inbox item</div>
          ) : selected.type === 'booking' ? (
            <BookingDetail item={selected} />
          ) : (
            <FlaggedDetail item={selected} />
          )}
        </div>
      </div>
    </div>
  )
}

function BookingDetail({ item }: { item: InboxItem }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{item.customer} — Booking Request</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>42 Ponsonby Rd, Ponsonby · Submitted 11:12am</div>
        </div>
        <button style={secondaryBtn}>View history</button>
      </div>

      <SectionLabel>Customer message</SectionLabel>
      <div style={{ background: '#F0F9FF', borderLeft: '3px solid #38BDF8', borderRadius: '0 8px 8px 0', padding: '10px 14px', color: '#374151', fontSize: 13, fontStyle: 'italic' }}>
        "Pool looks cloudy after the storm last night. Can someone come out today or tomorrow? We have guests on the weekend."
      </div>

      <SectionLabel>Pool context</SectionLabel>
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px' }}>
        <MetaRow k='Last service' v='5 days ago · James T.' />
        <MetaRow k='pH' v='7.4 — Good' good />
        <MetaRow k='Chlorine' v='1.8 — Good' good />
        <MetaRow k='LSI' v='+0.1 — Balanced' good />
        <MetaRow k='Service plan' v='Weekly · Fortnightly' />
      </div>

      <SectionLabel>Confirm a visit</SectionLabel>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <input type='date' defaultValue='2026-04-01' style={field} />
        <input type='time' defaultValue='10:00' style={{ ...field, width: 120 }} />
        <select style={field} defaultValue='James T.'>
          <option>James T.</option>
          <option>Mike R.</option>
          <option>Sarah K.</option>
        </select>
      </div>
      <button style={confirmBtn}>Confirm visit — customer will be notified</button>
    </>
  )
}

function FlaggedDetail({ item }: { item: InboxItem }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{item.customer} — Flagged Reading</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{item.meta}</div>
        </div>
        <span style={{ ...pillFor('flagged'), alignSelf: 'flex-start' }}>Flagged reading</span>
      </div>

      <SectionLabel>Alert</SectionLabel>
      <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 12, color: '#B91C1C', fontSize: 13 }}>
        Chlorine measured at <strong>0.8 ppm</strong> (target 1.0 - 3.0). Recommend immediate corrective treatment.
      </div>

      <SectionLabel>Recent context</SectionLabel>
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px' }}>
        <MetaRow k='Technician' v='James T.' />
        <MetaRow k='Recorded at' v='9:42am today' />
        <MetaRow k='Previous reading' v='1.7 ppm (last week)' />
        <MetaRow k='Risk level' v='Medium' />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button style={secondaryBtn}>Assign follow-up</button>
        <button style={confirmBtn}>Mark as reviewed</button>
      </div>
    </>
  )
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

function pillLabel(type: InboxType) {
  if (type === 'booking') return 'Booking request'
  if (type === 'flagged') return 'Flagged reading'
  return 'Resolved'
}

function pillFor(type: InboxType): React.CSSProperties {
  if (type === 'booking') return { ...pillBase, background: '#E0F2FE', color: '#0284C7' }
  if (type === 'flagged') return { ...pillBase, background: '#FEF3C7', color: '#D97706' }
  return { ...pillBase, background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }
}

const pillBase: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  borderRadius: 20,
  padding: '3px 9px',
}

const secondaryBtn: React.CSSProperties = {
  background: '#F9FAFB',
  color: '#374151',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
}

const field: React.CSSProperties = {
  background: '#F9FAFB',
  border: '1px solid #D1D5DB',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  color: '#111827',
  flex: 1,
}

const confirmBtn: React.CSSProperties = {
  width: '100%',
  background: '#111827',
  color: '#F9FAFB',
  border: 'none',
  borderRadius: 10,
  padding: 13,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

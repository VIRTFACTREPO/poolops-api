import { useEffect, useMemo, useState } from 'react'

type DashboardData = {
  automations: number
  jobsToday: number
  flaggedReadings: number
}

type TeamRow = { id: string; name: string; done: number; assigned: number }
type FlaggedRow = { id: string; pool: string; reading: string; value: string; range: string; time: string }
type ActivityRow = { id: string; text: string; time: string }

const quickActions = [
  { id: 'add-job', label: 'Add Job', hint: 'Create a new service job' },
  { id: 'add-customer', label: 'Add Customer', hint: 'Add a new customer profile' },
  { id: 'view-schedule', label: 'View Schedule', hint: 'See today\'s route plan' },
  { id: 'view-inbox', label: 'View Inbox', hint: 'Review incoming requests' },
]

const teamProgressMock: TeamRow[] = [
  { id: 't1', name: 'J. Taylor', done: 5, assigned: 8 },
  { id: 't2', name: 'M. Chen', done: 6, assigned: 7 },
  { id: 't3', name: 'R. Singh', done: 3, assigned: 6 },
]

const flaggedReadingsMock: FlaggedRow[] = [
  { id: 'f1', pool: 'Acme Pool Co', reading: 'pH', value: '8.1', range: '7.2 - 7.6', time: '10m ago' },
  { id: 'f2', pool: 'Harbor Heights', reading: 'Free Chlorine', value: '0.6 ppm', range: '1.0 - 3.0', time: '24m ago' },
  { id: 'f3', pool: 'Sunrise Residence', reading: 'Alkalinity', value: '145 ppm', range: '80 - 120', time: '1h ago' },
]

const activityMock: ActivityRow[] = [
  { id: 'a1', text: 'Job #2043 marked complete by J. Taylor', time: '2m ago' },
  { id: 'a2', text: 'Booking request received from Acme Pool Co', time: '9m ago' },
  { id: 'a3', text: 'Low stock alert: Liquid Chlorine (2 drums left)', time: '18m ago' },
  { id: 'a4', text: 'Daily automations run finished successfully', time: '48m ago' },
]

const statFallback: DashboardData = {
  automations: 12,
  jobsToday: 21,
  flaggedReadings: 3,
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardData>(statFallback)

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        const base = import.meta.env.VITE_API_BASE_URL || ''
        const res = await fetch(`${base}/admin/dashboard`)
        if (!res.ok) return
        const payload = await res.json()
        const data = payload?.data || payload
        if (!active) return
        setStats({
          automations: Number(data?.automations ?? statFallback.automations),
          jobsToday: Number(data?.jobsToday ?? statFallback.jobsToday),
          flaggedReadings: Number(data?.flaggedReadings ?? statFallback.flaggedReadings),
        })
      } catch {
        // keep fallback
      }
    }
    run()
    return () => {
      active = false
    }
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
            style={{
              textAlign: 'left',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              padding: '14px 14px',
              color: '#111827',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>{action.label}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#6B7280' }}>{action.hint}</div>
          </button>
        ))}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#FFFFFF',
        }}
      >
        <StatCell label='Automations' value={stats.automations} />
        <StatCell label='Jobs Today' value={stats.jobsToday} withBorder />
        <StatCell label='Flagged Readings' value={stats.flaggedReadings} highlight withBorder />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card title='Team Progress'>
          <div style={{ display: 'grid', gap: 10 }}>
            {teamProgressMock.map((row) => {
              const pct = row.assigned > 0 ? Math.round((row.done / row.assigned) * 100) : 0
              return (
                <div key={row.id} style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#374151' }}>{row.name}</span>
                    <span style={{ color: '#6B7280' }}>
                      {row.done}/{row.assigned}
                    </span>
                  </div>
                  <div style={{ height: 8, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: pct >= 80 ? '#22C55E' : '#0EA5E9',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card title='Flagged Readings'>
          <div style={{ display: 'grid', gap: 10 }}>
            {flaggedReadingsMock.map((row) => (
              <div
                key={row.id}
                style={{
                  display: 'grid',
                  gap: 3,
                  border: '1px solid #FECACA',
                  background: '#FEF2F2',
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#DC2626', fontWeight: 600 }}>{row.pool}</span>
                  <span style={{ color: '#6B7280' }}>{row.time}</span>
                </div>
                <div style={{ fontSize: 13, color: '#111827' }}>
                  {row.reading}: <strong>{row.value}</strong> <span style={{ color: '#6B7280' }}>(target {row.range})</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <Card title='Activity Feed'>
          <div style={{ display: 'grid', gap: 8 }}>
            {activityMock.map((row) => (
              <div
                key={row.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontSize: 13,
                  borderBottom: '1px solid #F3F4F6',
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: '#374151' }}>{row.text}</span>
                <span style={{ color: '#6B7280', whiteSpace: 'nowrap' }}>{row.time}</span>
              </div>
            ))}
          </div>
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

function StatCell({
  label,
  value,
  withBorder,
  highlight,
}: {
  label: string
  value: number
  withBorder?: boolean
  highlight?: boolean
}) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderLeft: withBorder ? '1px solid #E5E7EB' : undefined,
      }}
    >
      <div style={{ fontSize: 12, color: '#6B7280' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: highlight ? '#EF4444' : '#111827', marginTop: 4 }}>{value}</div>
    </div>
  )
}

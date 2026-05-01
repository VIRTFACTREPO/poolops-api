/* global React, StatCard, Spark, TrafficDotAdm, PillAdm */

const TECH_COLORS = { JT: '#0EA5E9', MK: '#8B5CF6', SL: '#22C55E', RK: '#F59E0B' };

function W3Dashboard() {
  const runs = [
    { time: '8:00', cust: 'Anderson, P.', addr: '14 Bassett Rd', tech: 'JT', status: 'green', flag: null },
    { time: '9:15', cust: 'Kumar, A.',    addr: '22 Benson Rd',  tech: 'MK', status: 'green', flag: null },
    { time: '10:15', cust: 'Smith, D.',   addr: '12 Remuera Rd',  tech: 'JT', status: 'amber', flag: 'pH slightly high' },
    { time: '11:00', cust: 'Chen, W.',     addr: '7 Victoria Ave', tech: 'MK', status: 'green', flag: null },
    { time: '11:45', cust: 'Taylor, J.',   addr: '9 Shore Rd',     tech: 'SL', status: 'green', flag: null },
    { time: '12:15', cust: 'Patel Res.',   addr: '33 Orakei Rd',   tech: 'JT', status: 'neutral', flag: null },
    { time: '1:30',  cust: 'Williams Est.',addr: '88 Tamaki Dr',   tech: 'SL', status: 'red',   flag: 'Algae visible · callout' },
    { time: '2:15',  cust: 'Nguyen, H.',   addr: '4 Gowing Dr',    tech: 'MK', status: 'neutral', flag: null },
  ];

  return (
    <div style={{ padding: '24px 32px 40px', background: '#F5F5F3' }}>
      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Runs today" value="47" delta="12 vs last Thu" deltaType="up" spark={<Spark />} />
        <StatCard label="Completion rate" value="94%" delta="2% this week" deltaType="up" spark={<Spark color="#22C55E" data={[60,62,65,68,72,74,78,82]} />} />
        <StatCard label="Flagged pools" value="3" delta="1 since yesterday" deltaType="up" spark={<Spark color="#EF4444" data={[1,2,1,3,2,3,3,3]} />} />
        <StatCard label="Revenue · week" value="$12,480" delta="8% vs last week" deltaType="up" spark={<Spark color="#0EA5E9" data={[40,45,42,55,50,65,60,72]} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        {/* TODAY'S RUNS TABLE */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Today's run sheet</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Thursday 14 November · 47 stops</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <PillAdm variant="ink">All techs</PillAdm>
              <PillAdm>Filter</PillAdm>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                <th style={{ ...thStyle, width: 70 }}>Time</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Address</th>
                <th style={{ ...thStyle, width: 80 }}>Tech</th>
                <th style={{ ...thStyle, width: 160 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F3F4F6', borderLeft: r.status === 'red' ? '2px solid #EF4444' : '2px solid transparent' }}>
                  <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', color: '#6B7280', fontWeight: 500 }}>{r.time}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{r.cust}</td>
                  <td style={{ ...tdStyle, color: '#6B7280' }}>{r.addr}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 12, background: TECH_COLORS[r.tech], color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{r.tech}</span>
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {r.flag ? (
                      <PillAdm variant={r.status}><TrafficDotAdm status={r.status} />{r.flag}</PillAdm>
                    ) : r.status === 'neutral' ? (
                      <span style={{ color: '#9CA3AF', fontSize: 12 }}>Pending</span>
                    ) : (
                      <PillAdm variant="green"><TrafficDotAdm status="green" />On track</PillAdm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SIDE — flagged + tech load */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Needs attention</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>3 pools flagged this morning</div>
            {[
              { c: 'Smith, D.', n: 'pH reading 8.2 · out of range', s: 'amber' },
              { c: 'Williams Estate', n: 'Algae visible · algaecide needed', s: 'red' },
              { c: 'Patel Res.', n: 'Missed visit Tuesday', s: 'amber' },
            ].map((a, i) => (
              <div key={i} style={{ padding: '10px 0', borderTop: i > 0 ? '1px solid #F3F4F6' : 'none', display: 'flex', gap: 10 }}>
                <TrafficDotAdm status={a.s} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{a.c}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{a.n}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Technician load · today</div>
            {[
              { n: 'James T.', i: 'JT', total: 14, done: 3 },
              { n: 'Marama K.', i: 'MK', total: 11, done: 3 },
              { n: 'Sam L.', i: 'SL', total: 9, done: 2 },
            ].map((t, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? 12 : 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: TECH_COLORS[t.i], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{t.i}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{t.n}</span>
                    <span style={{ fontSize: 11, color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>{t.done}/{t.total}</span>
                  </div>
                  <div style={{ height: 5, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${(t.done / t.total) * 100}%`, height: '100%', background: TECH_COLORS[t.i], borderRadius: 99 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle = { textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 };
const tdStyle = { padding: '11px 14px', verticalAlign: 'middle' };

Object.assign(window, { W3Dashboard, TECH_COLORS });

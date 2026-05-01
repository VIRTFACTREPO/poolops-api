/* global React, PillAdm, TECH_COLORS */

function W14Team() {
  const team = [
    { n: 'James Thompson', i: 'JT', role: 'Senior technician', phone: '021 456 789', pools: 86, load: 14, max: 15, status: 'active', rating: 4.9 },
    { n: 'Marama Kahu',   i: 'MK', role: 'Technician',        phone: '022 334 567', pools: 72, load: 11, max: 15, status: 'active', rating: 4.8 },
    { n: 'Sam Lee',       i: 'SL', role: 'Technician',        phone: '027 888 123', pools: 54, load: 9,  max: 12, status: 'active', rating: 4.9 },
    { n: 'Rangi Kahui',   i: 'RK', role: 'Trainee',           phone: '021 900 444', pools: 28, load: 6,  max: 10, status: 'onboarding', rating: null },
  ];

  return (
    <div style={{ padding: '20px 32px 40px', background: '#F5F5F3' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <MiniStat label="Active techs" value="4" sub="+1 onboarding" />
        <MiniStat label="Avg load today" value="10.0" sub="of 13 capacity" />
        <MiniStat label="On-time rate" value="96%" sub="this week" />
        <MiniStat label="Avg rating" value="4.87" sub="last 30 days" />
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Technician roster</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Manage load, schedules, and access</div>
          </div>
          <div style={{ background: '#111827', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600 }}>+ Invite technician</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              <th style={thSt}>Technician</th>
              <th style={thSt}>Role</th>
              <th style={{ ...thSt, width: 140 }}>Contact</th>
              <th style={{ ...thSt, width: 110, textAlign: 'right' }}>Pools</th>
              <th style={{ ...thSt, width: 220 }}>Load today</th>
              <th style={{ ...thSt, width: 100 }}>Rating</th>
              <th style={{ ...thSt, width: 110 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {team.map((t, i) => (
              <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                <td style={tdSt}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 16, background: TECH_COLORS[t.i], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{t.i}</div>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{t.n}</span>
                  </div>
                </td>
                <td style={{ ...tdSt, color: '#6B7280' }}>{t.role}</td>
                <td style={{ ...tdSt, color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>{t.phone}</td>
                <td style={{ ...tdSt, textAlign: 'right', fontWeight: 600, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{t.pools}</td>
                <td style={tdSt}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${(t.load / t.max) * 100}%`, height: '100%', background: TECH_COLORS[t.i], borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#6B7280', fontVariantNumeric: 'tabular-nums', minWidth: 42, textAlign: 'right' }}>{t.load}/{t.max}</span>
                  </div>
                </td>
                <td style={{ ...tdSt, fontVariantNumeric: 'tabular-nums' }}>
                  {t.rating ? <span style={{ color: '#111827', fontWeight: 600 }}>★ {t.rating}</span> : <span style={{ color: '#9CA3AF' }}>—</span>}
                </td>
                <td style={tdSt}>
                  {t.status === 'active' ? <PillAdm variant="green">Active</PillAdm> : <PillAdm variant="amber">Onboarding</PillAdm>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', padding: '14px 18px' }}>
      <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{sub}</div>
    </div>
  );
}

const thSt = { textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 };
const tdSt = { padding: '12px 14px', verticalAlign: 'middle' };

Object.assign(window, { W14Team });

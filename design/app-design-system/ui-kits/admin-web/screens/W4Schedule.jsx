/* global React, TECH_COLORS */

function W4Schedule() {
  const days = ['Mon 11', 'Tue 12', 'Wed 13', 'Thu 14', 'Fri 15'];
  const slots = ['8:00','9:00','10:00','11:00','12:00','1:00','2:00','3:00'];

  // Sparse entries — keyed by slotIndex × dayIndex
  const entries = {
    '0-0': { c: 'Anderson',     tech: 'JT', s: 'green' },
    '0-2': { c: 'Williams Est.',tech: 'SL', s: 'red'   },
    '1-0': { c: 'Kumar',        tech: 'MK', s: 'green' },
    '1-1': { c: 'Chen, W.',     tech: 'JT', s: 'amber' },
    '1-3': { c: 'Smith, D.',    tech: 'JT', s: 'amber' },
    '2-2': { c: 'Patel Res.',   tech: 'MK', s: 'green' },
    '2-3': { c: 'Taylor',       tech: 'SL', s: 'green' },
    '3-0': { c: 'O\u2019Brien',     tech: 'MK', s: 'green' },
    '3-3': { c: 'Nguyen',       tech: 'MK', s: 'green' },
    '4-1': { c: 'Robinson',     tech: 'SL', s: 'green' },
    '4-4': { c: 'Lee, K.',      tech: 'JT', s: 'amber' },
    '5-2': { c: 'Hohepa',       tech: 'JT', s: 'green' },
    '5-4': { c: 'Clarke',       tech: 'SL', s: 'green' },
    '6-0': { c: 'Mason',        tech: 'MK', s: 'green' },
    '6-3': { c: 'Barrett',      tech: 'JT', s: 'green' },
  };

  return (
    <div style={{ padding: '20px 32px 40px', background: '#F5F5F3' }}>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Week of 11 Nov</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>52 scheduled visits · drag cards to reassign</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#6B7280' }}>‹</div>
            <div style={{ padding: '5px 10px', fontSize: 12, color: '#6B7280' }}>Week</div>
            <div style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#6B7280' }}>›</div>
            <div style={{ background: '#111827', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, marginLeft: 6 }}>+ Add visit</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(5, 1fr)', borderTop: '1px solid #F3F4F6' }}>
          {/* Header row */}
          <div style={{ padding: '10px 8px', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, borderRight: '1px solid #F3F4F6' }}></div>
          {days.map((d) => (
            <div key={d} style={{ padding: '12px 14px', fontSize: 11, color: '#6B7280', fontWeight: 600, borderRight: '1px solid #F3F4F6', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
          ))}

          {slots.map((t, si) => (
            <React.Fragment key={t}>
              <div style={{ padding: '14px 8px 14px 14px', fontSize: 11, color: '#9CA3AF', fontWeight: 500, borderTop: '1px solid #F3F4F6', borderRight: '1px solid #F3F4F6', fontVariantNumeric: 'tabular-nums' }}>{t}</div>
              {days.map((d, di) => {
                const e = entries[`${si}-${di}`];
                return (
                  <div key={di} style={{ padding: 6, minHeight: 56, borderTop: '1px solid #F3F4F6', borderRight: '1px solid #F3F4F6', background: si % 2 ? '#FCFCFB' : '#fff' }}>
                    {e && (
                      <div style={{
                        padding: '6px 8px', borderRadius: 6, fontSize: 11,
                        background: e.s === 'red' ? '#FEF2F2' : e.s === 'amber' ? '#FFFBEB' : '#fff',
                        border: `1px solid ${e.s === 'red' ? '#FCA5A5' : e.s === 'amber' ? '#FDE68A' : '#E5E7EB'}`,
                        borderLeft: `3px solid ${TECH_COLORS[e.tech]}`,
                        cursor: 'grab',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{e.c}</div>
                        <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>{e.tech} · weekly</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { W4Schedule });

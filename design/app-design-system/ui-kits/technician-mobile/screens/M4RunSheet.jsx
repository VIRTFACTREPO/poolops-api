/* global React, Phone, Pill, TrafficDot, Icon */
const { useState: useStateM4 } = React;

function M4RunSheet({ onOpenPool }) {
  return (
    <Phone>
      {/* Header */}
      <div style={{ padding: '14px 22px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5F5F3' }}>
        <div>
          <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Thursday</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: -0.4 }}>14 November</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5F5F3', fontSize: 12, fontWeight: 600 }}>JT</div>
      </div>

      {/* Progress strip */}
      <div style={{ margin: '0 22px 14px', padding: 14, background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Today's route</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>3 of 11</div>
        </div>
        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: '27%', height: '100%', background: '#111827', borderRadius: 99 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#9CA3AF' }}>
          <span>Start 7:30am</span>
          <span>Est. finish 4:15pm</span>
        </div>
      </div>

      {/* Next up */}
      <div style={{ margin: '0 22px 10px', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Next up</div>
      <div onClick={onOpenPool} style={{ margin: '0 22px 18px', padding: 16, background: '#fff', border: '1px solid #111827', borderRadius: 16, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Smith, David</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>12 Remuera Rd, Remuera</div>
          </div>
          <Pill variant="ink">10:15 am</Pill>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <Pill variant="blue">Salt · 45k L</Pill>
          <Pill variant="neutral">Weekly</Pill>
          <Pill variant="amber">Access notes</Pill>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
            <Icon name="map-pin" size={14} color="#6B7280" />
            <span>3.2 km · 12 min</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#111827', fontWeight: 600 }}>
            Open brief
            <Icon name="chevron-right" size={14} />
          </div>
        </div>
      </div>

      {/* Pending list */}
      <div style={{ margin: '0 22px 10px', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
        <span>Pending · 8</span><span style={{ color: '#6B7280', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>↓ route order</span>
      </div>

      {[
        { name: 'Chen, Wei', addr: '7 Victoria Ave, Parnell', time: '11:00 am', flag: null, dist: '4.1 km' },
        { name: 'Patel Residence', addr: '33 Orakei Rd, Mission Bay', time: '12:15 pm', flag: 'amber', dist: '5.8 km' },
        { name: 'The Williams Estate', addr: '88 Tamaki Dr', time: '1:30 pm', flag: 'red', dist: '2.1 km' },
      ].map((stop, i) => (
        <div key={i} style={{ margin: '0 22px 8px', padding: '12px 14px', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {stop.flag && <TrafficDot status={stop.flag} />}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{stop.name}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{stop.addr} · {stop.dist}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>{stop.time}</div>
        </div>
      ))}

      <div style={{ margin: '14px 22px 10px', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Completed · 3</div>
      <div style={{ margin: '0 22px 20px', padding: '10px 14px', background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="check" size={16} color="#22C55E" />
          <div style={{ fontSize: 13, color: '#6B7280' }}>Anderson · Kumar · Taylor</div>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>9:58am</div>
      </div>
    </Phone>
  );
}

Object.assign(window, { M4RunSheet });

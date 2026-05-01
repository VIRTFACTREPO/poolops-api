/* global React, Phone, Pill, Button, Icon, TrafficDot */
function M5PoolBrief({ onBack, onStart }) {
  return (
    <Phone>
      {/* Sticky header with back */}
      <div style={{ padding: '12px 20px 12px', display: 'flex', alignItems: 'center', gap: 14, background: '#F5F5F3', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div onClick={onBack} style={{ width: 36, height: 36, borderRadius: 12, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevron-left" size={18} color="#111827" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Pool brief</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Smith, David</div>
        </div>
      </div>

      <div style={{ padding: '16px 20px 100px', overflow: 'auto', flex: 1 }}>
        {/* Address + nav */}
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, padding: 14, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>12 Remuera Rd, Remuera 1050</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>3.2 km · 12 min via SH1</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1, padding: '10px', background: '#111827', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="map-pin" size={14} color="#fff" /> Navigate
            </div>
            <div style={{ width: 44, height: 40, borderRadius: 10, background: '#F3F4F6', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bell" size={16} color="#374151" />
            </div>
          </div>
        </div>

        {/* Access notes — amber accent */}
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: '4px solid #F59E0B', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#B45309', marginBottom: 4 }}>Access notes</div>
          <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.45 }}>Gate code <b>4521</b> · Dog in yard Tuesdays · Enter via side path on left</div>
        </div>

        {/* Pool specs */}
        <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Pool specs</div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', padding: 4, marginBottom: 14 }}>
          {[
            ['Volume', '45,000 L'], ['Surface', 'Pebblecrete'],
            ['Sanitisation', 'Salt chlorinator'], ['Equipment', 'Astral Viron eQuilibrium']
          ].map(([k, v], i) => (
            <div key={i} style={{ padding: '10px 12px', borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>{k}</span>
              <span style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Trend chart */}
        <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Chlorine · Last 30 days</div>
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="none">
            <rect y="28" width="300" height="24" fill="#F0FDF4" />
            <line x1="0" y1="28" x2="300" y2="28" stroke="#22C55E" strokeDasharray="2 3" strokeOpacity="0.4" />
            <line x1="0" y1="52" x2="300" y2="52" stroke="#22C55E" strokeDasharray="2 3" strokeOpacity="0.4" />
            <polyline fill="none" stroke="#0EA5E9" strokeWidth="2" points="0,45 30,38 60,42 90,32 120,46 150,40 180,35 210,55 240,50 270,40 300,36" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300].map((x, i) => {
              const ys = [45, 38, 42, 32, 46, 40, 35, 55, 50, 40, 36];
              return <circle key={i} cx={x} cy={ys[i]} r="2.5" fill="#0EA5E9" />;
            })}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
            <span>15 Oct</span><span>Target 1.0–3.0</span><span>Today</span>
          </div>
        </div>

        {/* Last visits */}
        <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Last 3 visits</div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', padding: 4 }}>
          {[
            { d: '7 Nov', t: 'James T.', s: 'green', n: 'All balanced' },
            { d: '31 Oct', t: 'James T.', s: 'amber', n: 'pH 7.8 · dosed 200ml HCl' },
            { d: '24 Oct', t: 'Marama K.', s: 'green', n: 'All balanced' },
          ].map((v, i) => (
            <div key={i} style={{ padding: '10px 12px', borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none', display: 'flex', gap: 10, alignItems: 'center' }}>
              <TrafficDot status={v.s} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{v.d} · {v.t}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{v.n}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{ padding: '12px 20px 8px', background: 'linear-gradient(to top, #F5F5F3 70%, rgba(245,245,243,0))', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
        <Button onClick={onStart} icon={<Icon name="play" size={14} color="#fff" />}>Start visit</Button>
      </div>
    </Phone>
  );
}

Object.assign(window, { M5PoolBrief });

/* global React, Phone, Pill, TrafficDot, Icon, LogoMark */
function OwnerHome({ onOpenBrief }) {
  return (
    <Phone>
      {/* Header */}
      <div style={{ padding: '14px 22px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5F5F3' }}>
        <div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Good morning,</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: -0.3 }}>David</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>DS</div>
      </div>

      {/* HERO — water status card, the signature owner moment */}
      <div style={{ margin: '0 22px 14px', padding: 22, background: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)', borderRadius: 20, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        {/* Ripple BG */}
        <svg style={{ position: 'absolute', right: -40, top: -40, opacity: 0.18 }} width="180" height="180" viewBox="0 0 100 100" fill="none" stroke="#fff" strokeWidth="1">
          <circle cx="50" cy="50" r="20" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="48" />
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, opacity: 0.85, marginBottom: 10, position: 'relative' }}>
          <TrafficDot status="green" size={7} /> Water quality
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.25, marginBottom: 6, letterSpacing: -0.3, position: 'relative' }}>
          Your pool water is in<br/>excellent balance.
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, position: 'relative' }}>No action needed from you. Last checked Thursday.</div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8, fontSize: 11, position: 'relative' }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.18)' }}>pH balanced</span>
          <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.18)' }}>Chlorine in range</span>
        </div>
      </div>

      {/* Next visit */}
      <div style={{ margin: '0 22px 10px', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Next visit</div>
      <div style={{ margin: '0 22px 18px', padding: 14, background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 48, height: 52, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>Thu</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>21</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Weekly service visit</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>James T. · arriving 10:15 am</div>
        </div>
        <Icon name="chevron-right" size={16} color="#9CA3AF" />
      </div>

      {/* Recent visits */}
      <div style={{ margin: '0 22px 10px', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Recent visits</div>
      {[
        { d: 'Thu 7 Nov', n: 'Everything balanced. No action needed.', s: 'green' },
        { d: 'Thu 31 Oct', n: 'pH adjusted — back in range.', s: 'amber' },
        { d: 'Thu 24 Oct', n: 'Everything balanced. No action needed.', s: 'green' },
      ].map((v, i) => (
        <div onClick={onOpenBrief} key={i} style={{ margin: '0 22px 8px', padding: '12px 14px', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
          <TrafficDot status={v.s} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{v.d}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>{v.n}</div>
          </div>
          <Icon name="chevron-right" size={14} color="#D1D5DB" />
        </div>
      ))}

      <div style={{ height: 18 }} />
    </Phone>
  );
}

function OwnerBrief({ onBack }) {
  return (
    <Phone>
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, background: '#F5F5F3', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div onClick={onBack} style={{ width: 36, height: 36, borderRadius: 12, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevron-left" size={18} color="#111827" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Visit details</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Thu 7 November</div>
        </div>
      </div>
      <div style={{ padding: '18px 20px', flex: 1, overflow: 'auto' }}>
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#15803D', marginBottom: 6 }}>
            <TrafficDot status="green" size={7}/> Balanced
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#14532D', marginBottom: 4 }}>Everything looked great.</div>
          <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.5 }}>James confirmed pH, chlorine and alkalinity are all in target range. No treatment was required.</div>
        </div>

        <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Readings</div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', padding: 4, marginBottom: 16 }}>
          {[['pH','7.4','Ideal'],['Chlorine','1.8 ppm','In range'],['Alkalinity','110 ppm','In range']].map(([k,v,s],i)=>(
            <div key={i} style={{ padding: '12px', borderBottom: i<2?'1px solid #F3F4F6':'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div><div style={{fontSize:12,color:'#6B7280'}}>{k}</div><div style={{fontSize:15,fontWeight:600,color:'#111827',marginTop:2}}>{v}</div></div>
              <Pill variant="green"><TrafficDot status="green" size={6}/>{s}</Pill>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>From your technician</div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', padding: 14, display:'flex', gap:10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: '#0EA5E9', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, flexShrink:0 }}>JT</div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>James T.</div>
            <div style={{ fontSize:12, color:'#6B7280', lineHeight:1.5, marginTop:3 }}>"Pool's running nicely. I emptied the skimmer basket — no action needed from you before next week."</div>
          </div>
        </div>
      </div>
    </Phone>
  );
}

Object.assign(window, { OwnerHome, OwnerBrief });

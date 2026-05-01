/* global React, Phone, Pill, Button, Icon, TrafficDot */
const { useState: useStateM6, useEffect: useEffectM6 } = React;

function M6ActiveJob({ onExit }) {
  const [tab, setTab] = useStateM6('readings');
  const [elapsed, setElapsed] = useStateM6(324); // seconds
  const [ph, setPh] = useStateM6('7.8');
  const [cl, setCl] = useStateM6('1.4');
  const [alk, setAlk] = useStateM6('120');

  useEffectM6(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  const tabs = [
    { id: 'readings', label: 'Readings', done: true },
    { id: 'treat', label: 'Treat', done: false },
    { id: 'photos', label: 'Photos', done: false },
    { id: 'notes', label: 'Notes', done: false },
    { id: 'done', label: 'Complete', done: false },
  ];

  return (
    <Phone>
      {/* Header w/ live timer */}
      <div style={{ padding: '12px 20px', background: '#111827', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Active job</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Smith, David</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.15)', padding: '4px 10px', borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4ADE80', fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</span>
          </div>
          <div onClick={onExit} style={{ fontSize: 20, color: '#94A3B8', cursor: 'pointer', padding: 4 }}>×</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <div key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '12px 4px', textAlign: 'center', position: 'relative',
              fontSize: 11, fontWeight: active ? 600 : 500, color: active ? '#111827' : '#9CA3AF',
              borderBottom: active ? '2px solid #111827' : '2px solid transparent', cursor: 'pointer',
            }}>
              {t.label}
              {t.done && <div style={{ position: 'absolute', top: 8, right: '24%', width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />}
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 20px', background: '#F5F5F3' }}>
        {tab === 'readings' && (
          <>
            <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 10 }}>Test kit readings</div>
            {[
              { label: 'pH', val: ph, set: setPh, unit: '', range: 'Target 7.2–7.6', status: 'amber', hint: 'Slightly high' },
              { label: 'Free Chlorine', val: cl, set: setCl, unit: 'ppm', range: 'Target 1.0–3.0', status: 'green', hint: 'In range' },
              { label: 'Total Alkalinity', val: alk, set: setAlk, unit: 'ppm', range: 'Target 80–120', status: 'green', hint: 'In range' },
            ].map((r) => (
              <div key={r.label} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{r.range}</div>
                  </div>
                  <Pill variant={r.status}>
                    <TrafficDot status={r.status} size={6} />
                    {r.hint}
                  </Pill>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    value={r.val}
                    onChange={(e) => r.set(e.target.value)}
                    style={{
                      width: 90, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8,
                      padding: '10px 12px', fontSize: 22, fontWeight: 700, color: '#111827',
                      fontFamily: 'Inter, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums', outline: 'none',
                    }}
                  />
                  {r.unit && <span style={{ fontSize: 13, color: '#6B7280' }}>{r.unit}</span>}
                </div>
              </div>
            ))}

            {/* Recommendation card — brand moment */}
            <div style={{ background: '#0F172A', borderRadius: 16, padding: 16, color: '#fff', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#7DD3FC', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>
                <Icon name="flask" size={12} color="#7DD3FC" /> Recommended treatment
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Lower pH to target range</div>
              <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>Add <b style={{ color: '#fff' }}>250ml hydrochloric acid</b>. Wait 4h before resanitising. Re-test on next visit.</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <div style={{ flex: 1, padding: 10, background: '#0EA5E9', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Apply treatment</div>
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 500, border: '1px solid rgba(255,255,255,0.12)' }}>Edit</div>
              </div>
            </div>
          </>
        )}

        {tab !== 'readings' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon name={tab === 'photos' ? 'camera' : tab === 'notes' ? 'pencil' : tab === 'done' ? 'check' : 'flask'} size={22} color="#6B7280" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{tabs.find((t) => t.id === tab).label}</div>
            <div style={{ fontSize: 13, color: '#6B7280', maxWidth: 240 }}>Step content rendered here. Each tab is a linear step in the active-job flow.</div>
          </div>
        )}
      </div>
    </Phone>
  );
}

Object.assign(window, { M6ActiveJob });

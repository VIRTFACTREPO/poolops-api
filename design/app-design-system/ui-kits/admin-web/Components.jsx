/* global React */

// ==========================================================
// SIDEBAR — dark navigation
// ==========================================================
function Sidebar({ active = 'dashboard', onNav }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'schedule',  label: 'Schedule',  icon: 'calendar' },
    { id: 'pools',     label: 'Pools',     icon: 'droplet' },
    { id: 'customers', label: 'Customers', icon: 'users' },
    { id: 'team',      label: 'Team',      icon: 'user' },
    { id: 'billing',   label: 'Billing',   icon: 'receipt' },
    { id: 'reports',   label: 'Reports',   icon: 'chart' },
    { id: 'settings',  label: 'Settings',  icon: 'gear' },
  ];
  return (
    <div style={{
      width: 240, background: '#0F172A', color: '#CBD5E1',
      display: 'flex', flexDirection: 'column', padding: '20px 14px',
      minHeight: '100vh', flexShrink: 0, fontSize: 13,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 24px' }}>
        <div style={{ width: 32, height: 32, background: '#0EA5E9', borderRadius: 10, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="#fff">
            <path d="M16 6C16 6 8 12 8 19C8 23.4 11.6 27 16 27C20.4 27 24 23.4 24 19C24 12 16 6 16 6Z" opacity="0.95"/>
            <path d="M16 13C16 13 12 16.5 12 19.5C12 21.7 13.8 23.5 16 23.5C18.2 23.5 20 21.7 20 19.5C20 16.5 16 13 16 13Z" opacity="0.45"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', letterSpacing: -0.2 }}>PoolOps</div>
          <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Auckland HQ</div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((it) => {
          const isActive = it.id === active;
          return (
            <div key={it.id}
              onClick={() => onNav && onNav(it.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8,
                background: isActive ? 'rgba(14,165,233,0.12)' : 'transparent',
                color: isActive ? '#7DD3FC' : '#94A3B8',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
              }}>
              <SideIcon name={it.icon} />
              {it.label}
            </div>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />
      <div style={{ padding: '12px', background: '#1E293B', borderRadius: 10, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, background: '#F59E0B', color: '#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>SC</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC' }}>Sarah Collins</div>
          <div style={{ fontSize: 10, color: '#64748B' }}>Owner · AquaClear</div>
        </div>
      </div>
    </div>
  );
}

function SideIcon({ name }) {
  const paths = {
    grid:     <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    droplet:  <path d="M12 2C12 2 5 10 5 15C5 19 8 22 12 22C16 22 19 19 19 15C19 10 12 2 12 2Z"/>,
    users:    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    user:     <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    receipt:  <><path d="M5 3v18l3-2 2 2 2-2 2 2 2-2 3 2V3"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/></>,
    chart:    <><line x1="4" y1="20" x2="4" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="20" y1="20" x2="20" y2="14"/></>,
    gear:     <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
  };
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

// ==========================================================
// TOP BAR
// ==========================================================
function TopBar({ title, subtitle, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px 20px', borderBottom: '1px solid #E5E7EB', background: '#F5F5F3' }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: -0.3 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280', width: 240 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Search customers, pools, techs…
        </div>
        {right}
      </div>
    </div>
  );
}

// ==========================================================
// STAT CARD
// ==========================================================
function StatCard({ label, value, delta, deltaType = 'up', spark }) {
  const deltaColor = deltaType === 'up' ? '#16A34A' : deltaType === 'down' ? '#DC2626' : '#6B7280';
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
          {delta && <div style={{ fontSize: 11, color: deltaColor, fontWeight: 600, marginTop: 2 }}>{deltaType === 'up' ? '↑' : deltaType === 'down' ? '↓' : '·'} {delta}</div>}
        </div>
        {spark && <div>{spark}</div>}
      </div>
    </div>
  );
}

function Spark({ color = '#0EA5E9', data = [30, 40, 35, 55, 50, 65, 60, 72] }) {
  const w = 80, h = 30;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / Math.max(1, max - min)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  );
}

function TrafficDotAdm({ status = 'green' }) {
  const c = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444', neutral: '#9CA3AF' }[status];
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />;
}

function PillAdm({ variant = 'neutral', children }) {
  const v = {
    green:   { bg: '#F0FDF4', fg: '#16A34A', br: '#BBF7D0' },
    amber:   { bg: '#FFFBEB', fg: '#D97706', br: '#FDE68A' },
    red:     { bg: '#FEF2F2', fg: '#DC2626', br: '#FECACA' },
    neutral: { bg: '#F9FAFB', fg: '#6B7280', br: '#E5E7EB' },
    ink:     { bg: '#111827', fg: '#F9FAFB', br: '#111827' },
  }[variant];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, background: v.bg, color: v.fg, border: `1px solid ${v.br}` }}>{children}</span>;
}

Object.assign(window, { Sidebar, TopBar, StatCard, Spark, TrafficDotAdm, PillAdm });

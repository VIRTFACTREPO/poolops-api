/* global React */
const { useState } = React;

// ============================================================
// STATUS BAR — 9:41 time + wifi/cell/battery SVG cluster
// ============================================================
function StatusBar() {
  return (
    <div style={techStyles.statusBar}>
      <span style={techStyles.statusTime}>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="#111827">
          <rect x="0" y="4" width="2.5" height="7" rx="1" opacity="0.3" />
          <rect x="4" y="2.5" width="2.5" height="8.5" rx="1" opacity="0.5" />
          <rect x="8" y="1" width="2.5" height="10" rx="1" opacity="0.7" />
          <rect x="12" y="0" width="2.5" height="11" rx="1" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 20 14" fill="#111827">
          <path d="M10 3C13 3 15.7 4.2 17.6 6.2L19 4.8C16.7 2.4 13.5 1 10 1S3.3 2.4 1 4.8L2.4 6.2C4.3 4.2 7 3 10 3Z" opacity="0.3" />
          <path d="M10 6C12.2 6 14.2 6.9 15.6 8.4L17 7C15.2 5.1 12.7 4 10 4S4.8 5.1 3 7L4.4 8.4C5.8 6.9 7.8 6 10 6Z" opacity="0.6" />
          <path d="M10 9C11.4 9 12.7 9.6 13.6 10.5L15 9.1C13.7 7.8 12 7 10 7S6.3 7.8 5 9.1L6.4 10.5C7.3 9.6 8.6 9 10 9Z" />
          <circle cx="10" cy="13" r="1.5" />
        </svg>
        <svg width="25" height="11" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#111827" strokeOpacity="0.35" />
          <rect x="1.5" y="1.5" width="16" height="9" rx="2.5" fill="#111827" />
          <path d="M23 4v4a2 2 0 0 0 0-4Z" fill="#111827" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// PHONE FRAME — 375×812 iOS-style with dynamic island + home pill
// ============================================================
function Phone({ children }) {
  return (
    <div style={techStyles.phone}>
      <StatusBar />
      <div style={techStyles.diWrap}><div style={techStyles.di} /></div>
      <div style={techStyles.phoneBody}>{children}</div>
      <div style={techStyles.homePill} />
    </div>
  );
}

// ============================================================
// PRIMITIVES
// ============================================================
function Button({ variant = 'primary', children, onClick, style, icon }) {
  const base = {
    width: '100%',
    border: 'none',
    borderRadius: 12,
    padding: '14px 20px',
    font: '600 15px/1.2 Inter, system-ui, sans-serif',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  };
  // INLINE styles — never class-based. Per implementation rule.
  const variants = {
    primary:     { backgroundColor: '#111827', color: '#FFFFFF' },
    secondary:   { backgroundColor: '#F3F4F6', color: '#111827', border: '1px solid #E5E7EB', borderRadius: 10 },
    destructive: { backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 10 },
    complete:    { backgroundColor: '#22C55E', color: '#FFFFFF' },
  };
  return (
    <div role="button" onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {icon}
      <span style={{ color: variants[variant].color }}>{children}</span>
    </div>
  );
}

function Pill({ variant = 'neutral', children, style }) {
  const variants = {
    green:   { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' },
    amber:   { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' },
    red:     { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' },
    blue:    { background: '#EFF6FF', color: '#0369A1', border: '1px solid #BAE6FD' },
    neutral: { background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB' },
    ink:     { background: '#111827', color: '#FFFFFF', border: '1px solid #111827' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 500, borderRadius: 20, padding: '3px 9px',
      ...variants[variant], ...style,
    }}>{children}</span>
  );
}

function TrafficDot({ status = 'green', size = 8 }) {
  const colors = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444', neutral: '#9CA3AF' };
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: colors[status], flexShrink: 0 }} />;
}

function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 1.5 }) {
  const paths = {
    'chevron-left':  <polyline points="15 18 9 12 15 6" />,
    'chevron-right': <polyline points="9 18 15 12 9 6" />,
    'map-pin':       <><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></>,
    'warning':       <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    'clock':         <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    'bell':          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />,
    'check':         <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
    'play':          <polygon points="5 3 19 12 5 21 5 3" fill={color} stroke="none" />,
    'menu':          <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="13" y2="18" /></>,
    'eye':           <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    'grid':          <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
    'flask':         <><path d="M9 3h6v5l5 11a2 2 0 0 1-1.8 3H5.8A2 2 0 0 1 4 19L9 8V3Z" /><line x1="9" y1="3" x2="15" y2="3" /></>,
    'camera':        <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
    'pencil':        <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" /></>,
    'arrow-right':   <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
    'plus':          <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    'home':          <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" /></>,
    'user':          <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// ============================================================
// LOGO MARK — droplet in droplet
// ============================================================
function LogoMark({ size = 32, fill = '#F5F5F3' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill={fill}>
      <path d="M16 6C16 6 8 12 8 19C8 23.4 11.6 27 16 27C20.4 27 24 23.4 24 19C24 12 16 6 16 6Z" opacity="0.92" />
      <path d="M16 13C16 13 12 16.5 12 19.5C12 21.7 13.8 23.5 16 23.5C18.2 23.5 20 21.7 20 19.5C20 16.5 16 13 16 13Z" opacity="0.42" />
    </svg>
  );
}

// ============================================================
// STYLES
// ============================================================
const techStyles = {
  phone: {
    width: 375,
    background: '#F5F5F3',
    borderRadius: 50,
    boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  statusBar: { background: '#F5F5F3', padding: '14px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusTime: { fontSize: 15, fontWeight: 600, color: '#111827' },
  diWrap: { background: '#F5F5F3', padding: '6px 0', display: 'flex', justifyContent: 'center' },
  di: { width: 120, height: 34, background: '#111827', borderRadius: 20 },
  phoneBody: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 680 },
  homePill: { width: 120, height: 4, background: '#111827', borderRadius: 99, margin: '10px auto 12px' },
};

Object.assign(window, { StatusBar, Phone, Button, Pill, TrafficDot, Icon, LogoMark, techStyles });

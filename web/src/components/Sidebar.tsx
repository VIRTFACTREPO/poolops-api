import { NavLink } from 'react-router-dom'
import { getUser } from '../lib/auth'
import { useInboxCount } from '../lib/useInboxCount'

const NAV = [
  {
    to: '/',
    label: 'Dashboard',
    end: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    to: '/schedule',
    label: 'Schedule',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    to: '/inbox',
    label: 'Inbox',
    badge: 0,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z"/>
        <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z"/>
      </svg>
    ),
  },
  {
    to: '/customers',
    label: 'Customers',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    to: '/records',
    label: 'Records',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    to: '/team',
    label: 'Team',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

function initials(name?: string) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(p => p[0]?.toUpperCase() ?? '').slice(0, 2).join('')
}

export default function Sidebar({ onLogout }: { onLogout?: () => void }) {
  const user = getUser()
  const isSuperAdmin = user?.role === 'superadmin'
  const inboxCount = useInboxCount()
  return (
    <div style={{
      width: 220,
      minWidth: 220,
      background: '#111827',
      borderRight: '1px solid #1F2937',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
    }}>
      <style>{`
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          margin-bottom: 2px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #9CA3AF;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .nav-item:hover {
          background: #1F2937;
          color: #D1D5DB;
        }
        .nav-item.active {
          background: #1F2937;
          color: #F9FAFB;
        }
        .sidebar-user:hover {
          background: #1F2937;
        }
      `}</style>

      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid #1F2937',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 28,
          height: 28,
          background: '#F5F5F3',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
            <path d="M16 6C16 6 8 12 8 19C8 23.4 11.6 27 16 27C20.4 27 24 23.4 24 19C24 12 16 6 16 6Z" fill="#111827" opacity="0.9"/>
            <path d="M16 13C16 13 12 16.5 12 19.5C12 21.7 13.8 23.5 16 23.5C18.2 23.5 20 21.7 20 19.5C20 16.5 16 13 16 13Z" fill="#111827" opacity="0.4"/>
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB' }}>PoolOps</span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {NAV.map((item) => {
          const badge = item.to === '/inbox' ? (inboxCount > 0 ? inboxCount : undefined) : item.badge
          return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            {item.icon}
            {item.label}
            {badge != null && (
              <span style={{
                marginLeft: 'auto',
                background: '#EF4444',
                color: '#fff',
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 10,
                padding: '1px 6px',
              }}>{badge}</span>
            )}
          </NavLink>
        )})}

        {isSuperAdmin && (
          <NavLink
            to="/platform"
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            style={{ marginTop: 12, borderTop: '1px solid #1F2937', paddingTop: 14 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
            </svg>
            Platform
          </NavLink>
        )}
      </nav>

      {/* User row */}
      <div style={{ padding: '16px 10px', borderTop: '1px solid #1F2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: '#374151',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: '#9CA3AF', flexShrink: 0,
          }}>
            {initials(user?.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#D1D5DB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? user?.email ?? '—'}
            </div>
            <div style={{ fontSize: 10, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isSuperAdmin ? 'Platform admin' : (user?.companyName ?? '')}
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

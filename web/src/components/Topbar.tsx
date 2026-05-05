import { useLocation } from 'react-router-dom'
import { useInboxCount } from '../lib/useInboxCount'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/schedule': 'Schedule',
  '/inbox': 'Inbox',
  '/customers': 'Customers',
  '/team': 'Team',
  '/records': 'Records',
  '/settings': 'Settings',
}

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/customers/')) return 'Customer Detail'
  if (pathname.startsWith('/records/')) return 'Record Detail'
  return ''
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-NZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function Topbar() {
  const { pathname } = useLocation()
  const inboxCount = useInboxCount()

  return (
    <div style={{
      height: 56,
      background: '#111827',
      borderBottom: '1px solid #1F2937',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB', flex: 1 }}>
        {getTitle(pathname)}
      </div>
      <div style={{ fontSize: 12, color: '#6B7280' }}>{formatDate()}</div>
      <div style={{ width: 1, height: 20, background: '#374151' }} />
      <div style={{ position: 'relative', cursor: 'pointer' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/>
        </svg>
        {inboxCount > 0 && (
          <div style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 7,
            height: 7,
            background: '#EF4444',
            borderRadius: '50%',
            border: '1.5px solid #111827',
          }} />
        )}
      </div>
      <div style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: '#374151',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 600,
        color: '#9CA3AF',
        cursor: 'pointer',
      }}>SJ</div>
    </div>
  )
}

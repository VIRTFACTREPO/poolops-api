import { Link, useLocation, useParams } from 'react-router-dom'

export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const params = useParams()

  let crumbs: { label: string; to?: string }[] = []

  if (pathname.startsWith('/customers/') && params.id) {
    crumbs = [
      { label: 'Customers', to: '/customers' },
      { label: `Customer ${params.id}` },
    ]
  } else if (pathname.startsWith('/records/') && params.id) {
    crumbs = [
      { label: 'Records', to: '/records' },
      { label: `Record ${params.id}` },
    ]
  }

  if (crumbs.length === 0) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 12 }}>
      {crumbs.map((crumb, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span style={{ color: '#6B7280' }}>/</span>}
          {crumb.to ? (
            <Link to={crumb.to} style={{ color: '#6B7280' }}>{crumb.label}</Link>
          ) : (
            <span style={{ color: '#F9FAFB' }}>{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { saveAuth } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Email and password are required'); return }
    setLoading(true)
    setError(null)
    try {
      const data = await api.post<{ token: string; refreshToken: string; role: string; user: { id: string; email: string; name?: string }; company?: { id: string; name: string } }>('/auth/login', { email, password })
      saveAuth(data.token, { id: data.user.id, email: data.user.email, name: data.user.name, role: data.role as 'admin' | 'superadmin', companyId: data.company?.id, companyName: data.company?.name }, data.refreshToken)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={logoRow}>
          <div style={logoMark}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M16 6C16 6 8 12 8 19C8 23.4 11.6 27 16 27C20.4 27 24 23.4 24 19C24 12 16 6 16 6Z" fill="#111827" opacity="0.9"/>
              <path d="M16 13C16 13 12 16.5 12 19.5C12 21.7 13.8 23.5 16 23.5C18.2 23.5 20 21.7 20 19.5C20 16.5 16 13 16 13Z" fill="#111827" opacity="0.4"/>
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>PoolOps</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px', letterSpacing: -0.3 }}>Sign in</h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 24px' }}>
          New here? <Link to="/signup" style={{ color: '#111827', fontWeight: 600 }}>Start your free trial</Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Password</label>
            <input style={inputStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <button type="submit" disabled={loading} style={loading ? { ...btnStyle, opacity: 0.6, cursor: 'not-allowed' } : btnStyle}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#F5F5F3',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}
const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 16,
  padding: 32,
  width: '100%',
  maxWidth: 400,
}
const logoRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }
const logoMark: React.CSSProperties = { width: 32, height: 32, background: '#F5F5F3', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const fieldGroup: React.CSSProperties = { display: 'grid', gap: 4 }
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151' }
const inputStyle: React.CSSProperties = { background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#111827', outline: 'none', width: '100%', boxSizing: 'border-box' }
const btnStyle: React.CSSProperties = { marginTop: 4, background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: -0.2 }
const errorStyle: React.CSSProperties = { fontSize: 12, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px' }

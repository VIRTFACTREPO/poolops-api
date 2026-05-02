import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { saveAuth } from '../lib/auth'

export default function Signup() {
  const navigate = useNavigate()
  const [companyName, setCompanyName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim() || !adminName.trim() || !email.trim() || !password) {
      setError('All fields are required')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.post<{ token: string; refreshToken: string; role: string; user: { id: string; email: string; name?: string }; company: { id: string; name: string } }>('/auth/signup', { companyName, adminName, email, password })
      saveAuth(data.token, { id: data.user.id, email: data.user.email, name: data.user.name, role: 'admin', companyName: data.company.name })
      navigate('/')
    } catch (err: any) {
      if ((err as any).status === 409) {
        setError('An account with this email already exists. Sign in instead.')
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
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

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px', letterSpacing: -0.3 }}>Start your free trial</h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 24px' }}>
          14 days free, no credit card required. Already have an account?{' '}
          <Link to="/login" style={{ color: '#111827', fontWeight: 600 }}>Sign in</Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Company name</label>
            <input style={inputStyle} placeholder="Pool Pro NZ" value={companyName} onChange={e => setCompanyName(e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Your name</label>
            <input style={inputStyle} placeholder="Jane Smith" value={adminName} onChange={e => setAdminName(e.target.value)} autoComplete="name" />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Work email</label>
            <input style={inputStyle} type="email" placeholder="jane@poolpronz.co.nz" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Password</label>
            <input style={inputStyle} type="password" placeholder="8+ characters" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <button type="submit" disabled={loading} style={loading ? { ...btnStyle, opacity: 0.6, cursor: 'not-allowed' } : btnStyle}>
            {loading ? 'Creating account…' : 'Create account & start trial'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#F5F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
const cardStyle: React.CSSProperties = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400 }
const logoRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }
const logoMark: React.CSSProperties = { width: 32, height: 32, background: '#F5F5F3', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const fieldGroup: React.CSSProperties = { display: 'grid', gap: 4 }
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151' }
const inputStyle: React.CSSProperties = { background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#111827', outline: 'none', width: '100%', boxSizing: 'border-box' }
const btnStyle: React.CSSProperties = { marginTop: 4, background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: -0.2 }
const errorStyle: React.CSSProperties = { fontSize: 12, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px' }

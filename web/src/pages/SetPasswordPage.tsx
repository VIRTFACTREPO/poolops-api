import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function SetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div style={outer}>
        <div style={card}>
          <Logo />
          <h1 style={h1}>Invalid invite link</h1>
          <p style={sub}>This invite link is invalid or has already been used. Contact your manager for a new invite.</p>
          <Link to="/login" style={linkBtn}>Go to sign in</Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div style={outer}>
        <div style={card}>
          <Logo />
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <h1 style={h1}>Password set!</h1>
          <p style={sub}>Download the PoolOps app and sign in with your email and new password.</p>
          <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
            <a href="https://apps.apple.com" style={storeBtn}>Download on the App Store</a>
            <a href="https://play.google.com" style={{ ...storeBtn, background: '#F9FAFB', color: '#111827', border: '1px solid #E5E7EB' }}>Get it on Google Play</a>
          </div>
          <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>Sign in to web portal instead</Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError(null)
    try {
      await api.post('/auth/set-password', { invite_token: token, password })
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Failed to set password. This link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={outer}>
      <div style={card}>
        <Logo />
        <h1 style={h1}>Set your password</h1>
        <p style={sub}>You've been invited to PoolOps. Set a password to activate your account.</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
          <div>
            <label style={labelStyle}>New password</label>
            <input style={field} type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Confirm password</label>
            <input style={field} type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          {error && <div style={errorBox}>{error}</div>}
          <button type="submit" disabled={loading} style={btn}>{loading ? 'Saving…' : 'Set password & activate'}</button>
        </form>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <path d="M16 6C16 6 8 12 8 19C8 23.4 11.6 27 16 27C20.4 27 24 23.4 24 19C24 12 16 6 16 6Z" fill="#111827" opacity="0.9"/>
        <path d="M16 13C16 13 12 16.5 12 19.5C12 21.7 13.8 23.5 16 23.5C18.2 23.5 20 21.7 20 19.5C20 16.5 16 13 16 13Z" fill="#111827" opacity="0.35"/>
      </svg>
      <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>PoolOps</span>
    </div>
  )
}

const outer: React.CSSProperties = { minHeight: '100vh', background: '#F5F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
const card: React.CSSProperties = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400 }
const h1: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 6px' }
const sub: React.CSSProperties = { fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5 }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }
const field: React.CSSProperties = { width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }
const errorBox: React.CSSProperties = { fontSize: 13, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px' }
const btn: React.CSSProperties = { width: '100%', background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: 999, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 48 }
const storeBtn: React.CSSProperties = { display: 'block', textAlign: 'center', background: '#111827', color: '#FFFFFF', textDecoration: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600 }
const linkBtn: React.CSSProperties = { display: 'block', textAlign: 'center', marginTop: 20, fontSize: 13, color: '#111827', fontWeight: 600, textDecoration: 'none' }

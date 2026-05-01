/* global React, Phone, Button, LogoMark */
const { useState: useStateM2 } = React;

function M2Login({ onLogin }) {
  const [email, setEmail] = useStateM2('james@aquaclear.co.nz');
  const [password, setPassword] = useStateM2('••••••••••');
  const [focused, setFocused] = useStateM2(null);

  return (
    <Phone>
      <div style={{ padding: '40px 28px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40, marginTop: 20 }}>
          <div style={{ width: 72, height: 72, background: '#111827', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <LogoMark size={44} fill="#F5F5F3" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: -0.5 }}>PoolOps</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Technician</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 4, letterSpacing: -0.3 }}>Welcome back</div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>Log in to see today's run sheet.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#F9FAFB',
                border: focused === 'email' ? '2px solid #111827' : '1px solid #E5E7EB',
                borderRadius: 8,
                padding: focused === 'email' ? '11px 13px' : '12px 14px',
                font: '400 15px/1.2 Inter, system-ui, sans-serif', color: '#111827', outline: 'none',
              }}
            />
          </label>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused('pw')}
              onBlur={() => setFocused(null)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#F9FAFB',
                border: focused === 'pw' ? '2px solid #111827' : '1px solid #E5E7EB',
                borderRadius: 8,
                padding: focused === 'pw' ? '11px 13px' : '12px 14px',
                font: '400 15px/1.2 Inter, system-ui, sans-serif', color: '#111827', outline: 'none',
              }}
            />
          </label>
          <a style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 500, alignSelf: 'flex-end' }}>Forgot password?</a>
        </div>

        <div style={{ marginTop: 24 }}>
          <Button onClick={onLogin}>Log in</Button>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', lineHeight: 1.5, marginTop: 20 }}>
          Need an account? Your company admin can invite you.<br />
          PoolOps never creates self-signups for field crews.
        </div>
      </div>
    </Phone>
  );
}

Object.assign(window, { M2Login });

const TOKEN_KEY = 'poolops_token'
const REFRESH_KEY = 'poolops_refresh_token'
const USER_KEY = 'poolops_user'

export type WebUser = {
  id: string
  email: string
  name?: string
  role: 'admin' | 'superadmin'
  companyId?: string
  companyName?: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function saveAuth(token: string, user: WebUser, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getUser(): WebUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function getTokenExpiry(): number | null {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ?? null
  } catch { return null }
}

export function tokenExpiresInSeconds(): number {
  const exp = getTokenExpiry()
  if (!exp) return 0
  return exp - Math.floor(Date.now() / 1000)
}

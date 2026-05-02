const TOKEN_KEY = 'poolops_token'
const USER_KEY = 'poolops_user'

export type WebUser = {
  id: string
  email: string
  name?: string
  role: 'admin' | 'superadmin'
  companyName?: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveAuth(token: string, user: WebUser): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
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

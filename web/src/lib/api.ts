import { getToken, getRefreshToken, saveToken, clearAuth } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'https://poolops-api-production.up.railway.app'

let refreshing: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing
  refreshing = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${refreshToken}` },
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data.data?.token) { saveToken(data.data.token); return true }
      return false
    } catch { return false }
    finally { refreshing = null }
  })()
  return refreshing
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  })
  const data = await res.json()
  if (!res.ok) {
    if (res.status === 401 && !isRetry) {
      const refreshed = await tryRefresh()
      if (refreshed) return request<T>(path, options, true)
      clearAuth()
      window.location.href = '/login'
    }
    const err = new Error(data.error?.message || 'Request failed') as Error & { code?: string; status?: number }
    err.code = data.error?.code
    err.status = res.status
    throw err
  }
  return data.data
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}

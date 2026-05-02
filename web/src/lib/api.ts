import { getToken } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'https://poolops-api-production.up.railway.app'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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

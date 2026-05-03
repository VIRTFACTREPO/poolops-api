import { useEffect, useRef } from 'react'
import { getRefreshToken, saveToken, tokenExpiresInSeconds, isAuthenticated } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL || 'https://poolops-api-production.up.railway.app'
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'pointermove'] as const
const REFRESH_THRESHOLD_SECS = 5 * 60  // refresh if expiry < 5 min away
const CHECK_INTERVAL_MS = 60_000       // check every 60s

export function useActivityRefresh() {
  const lastActiveRef = useRef(Date.now())

  useEffect(() => {
    const onActivity = () => { lastActiveRef.current = Date.now() }
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    return () => ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isAuthenticated()) return
      const secondsLeft = tokenExpiresInSeconds()
      const secondsSinceActivity = (Date.now() - lastActiveRef.current) / 1000
      if (secondsLeft > REFRESH_THRESHOLD_SECS) return
      if (secondsSinceActivity > 3600) return  // idle > 1h, let it expire
      const refreshToken = getRefreshToken()
      if (!refreshToken) return
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${refreshToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.data?.token) saveToken(data.data.token)
        }
      } catch { /* silent — next check will retry */ }
    }, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])
}

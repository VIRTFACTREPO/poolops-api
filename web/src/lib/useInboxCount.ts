import { useState, useEffect } from 'react'
import { api } from './api'

type InboxItem = { resolved: boolean }

export function useInboxCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    api.get<Array<InboxItem>>('/admin/inbox')
      .then((items) => {
        const unresolved = (items ?? []).filter((i) => !i.resolved).length
        setCount(unresolved)
      })
      .catch(() => setCount(0))
  }, [])

  return count
}

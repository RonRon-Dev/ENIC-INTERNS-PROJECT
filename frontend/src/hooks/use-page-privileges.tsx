import { useAuth } from '@/auth-context'
import { pagePrivilegesApi, type PagePrivilege } from '@/services/pagePrivileges'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

type PagePrivilegesContextType = {
  // url → lowercase role names. Empty array = all roles allowed.
  privileges: Record<string, string[]>
  refresh: () => Promise<void>
  loading: boolean
}

const PagePrivilegesContext = createContext<PagePrivilegesContextType | null>(null)

export function PagePrivilegesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [privileges, setPrivileges] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const data: PagePrivilege[] = await pagePrivilegesApi.getAll()
      const map: Record<string, string[]> = {}
      for (const p of data) {
        map[p.url] = p.allowedRoles // already lowercase from backend
      }
      setPrivileges(map)
    } catch {
      // silently fail — ProtectedRoute falls back to toolsData.allowedRoles
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    load()
  }, [load])

  return (
    <PagePrivilegesContext value={{ privileges, refresh: load, loading }}>
      {children}
    </PagePrivilegesContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePagePrivileges() {
  const ctx = useContext(PagePrivilegesContext)
  if (!ctx) throw new Error('usePagePrivileges must be used within <PagePrivilegesProvider>')
  return ctx
}

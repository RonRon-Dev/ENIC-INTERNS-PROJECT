import { useAuth } from '@/auth-context'
import { pagePrivilegesApi, type PagePrivilege } from '@/services/pagePrivileges'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

type PagePrivilegesContextType = {
  privileges: Record<string, string[]>
  maintenance: Record<string, boolean>
  refresh: (options?: { silent?: boolean }) => Promise<void>
  loading: boolean
}

const PagePrivilegesContext = createContext<PagePrivilegesContextType | null>(null)

export function PagePrivilegesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [privileges, setPrivileges] = useState<Record<string, string[]>>({})
  const [maintenance, setMaintenance] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!isAuthenticated) {
      setPrivileges({})
      setMaintenance({})
      return
    }

    const silent = options?.silent ?? false
    if (!silent) setLoading(true)

    try {
      const data: PagePrivilege[] = await pagePrivilegesApi.getAll()
      const privilegesMap: Record<string, string[]> = {}
      const maintenanceMap: Record<string, boolean> = {}

      for (const page of data) {
        privilegesMap[page.url] = page.allowedRoles
        maintenanceMap[page.url] = page.maintenance
      }

      setPrivileges(privilegesMap)
      setMaintenance(maintenanceMap)
    } catch {
      // ProtectedRoute falls back to toolsData.allowedRoles when the API is unavailable.
    } finally {
      if (!silent) setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    load()
  }, [load])

  return (
    <PagePrivilegesContext value={{ privileges, maintenance, refresh: load, loading }}>
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

import { type User } from '@/data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import { usersApi } from '@/services/users'
import React, { useEffect, useRef, useState } from 'react'

export type ApiRole = { id: number; name: string; icon?: string }

type UsersDialogType = 'add' | 'edit' | 'deactivate' | 'activate' | 'role' | 'approve' | 'reject' | 'approveReset' | 'adminReset' | 'unlock' | 'privileges' | 'assignRole'

type UsersContextType = {
  open: UsersDialogType | null
  setOpen: (str: UsersDialogType | null) => void
  currentRow: User | null
  setCurrentRow: React.Dispatch<React.SetStateAction<User | null>>
  apiRoles: ApiRole[]
  refreshRoles: () => Promise<void>
  refresh: () => void
  setRefresh: (fn: () => void) => void
}

const UsersContext = React.createContext<UsersContextType | null>(null)

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)
  const [apiRoles, setApiRoles] = useState<ApiRole[]>([])
  const refreshRef = useRef<() => void>(() => { })

  const refreshRoles = async () => {
    try {
      const res = await usersApi.getRoles()
      setApiRoles(res.data)
    } catch { }
  }

  useEffect(() => {
    refreshRoles()

  }, [])

  const refresh = () => refreshRef.current()
  const setRefresh = (fn: () => void) => { refreshRef.current = fn }

  return (
    <UsersContext value={{ open, setOpen, currentRow, setCurrentRow, apiRoles, refreshRoles, refresh, setRefresh }}>
      {children}
    </UsersContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = () => {
  const usersContext = React.useContext(UsersContext)

  if (!usersContext) {
    throw new Error('useUsers has to be used within <UsersContext>')
  }

  return usersContext
}

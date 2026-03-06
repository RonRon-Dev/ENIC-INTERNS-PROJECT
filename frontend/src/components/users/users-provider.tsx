import React, { useState, useEffect, useRef } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type User } from '@/data/schema'
import { usersApi } from '@/services/users'

export type ApiRole = { id: number; name: string }

type UsersDialogType = 'add' | 'edit' | 'deactivate' | 'activate' | 'role' | 'approve' | 'reject' | 'approveReset'

type UsersContextType = {
  open: UsersDialogType | null
  setOpen: (str: UsersDialogType | null) => void
  currentRow: User | null
  setCurrentRow: React.Dispatch<React.SetStateAction<User | null>>
  apiRoles: ApiRole[]
  refresh: () => void
  setRefresh: (fn: () => void) => void
}

const UsersContext = React.createContext<UsersContextType | null>(null)

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)
  const [apiRoles, setApiRoles] = useState<ApiRole[]>([])
  const refreshRef = useRef<() => void>(() => {})

  useEffect(() => {
    usersApi.getRoles()
      .then(res => setApiRoles(res.data))
      .catch(() => {})
  }, [])

  const refresh = () => refreshRef.current()
  const setRefresh = (fn: () => void) => { refreshRef.current = fn }

  return (
    <UsersContext value={{ open, setOpen, currentRow, setCurrentRow, apiRoles, refresh, setRefresh }}>
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

import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type ActivityLog } from '@/data/schema'


type LogsDialogType = 'desc'

type LogsContextType = {
  open: LogsDialogType | null
  setOpen: (str: LogsDialogType | null) => void
  currentRow: ActivityLog | null
  setCurrentRow: React.Dispatch<React.SetStateAction<ActivityLog | null>>
}

const LogsContext = React.createContext<LogsContextType | null>(null)

export function LogsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<LogsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<ActivityLog | null>(null)

  return (
    <LogsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </LogsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLogs = () => {
  const logsContext = React.useContext(LogsContext)

  if (!logsContext) {
    throw new Error('useLogs has to be used within <LogsContext>')
  }

  return logsContext
}

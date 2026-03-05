import React from 'react'
import useDialogState from '@/hooks/use-dialog-state'

type DialogType = 'passwordReset'

type ContextType = {
  open: DialogType | null
  setOpen: (str: DialogType | null) => void
}

const DialogContext = React.createContext<ContextType | null>(null)

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<DialogType>(null)

  return (
    <DialogContext.Provider value={{ open, setOpen }}> 
      {children}
    </DialogContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDialog = () => {
  const dialogContext = React.useContext(DialogContext)

  if (!dialogContext) {
    throw new Error('useDialog has to be used within <DialogContext>')
  }

  return dialogContext
}

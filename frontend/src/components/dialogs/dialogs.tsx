import { PasswordResetDialog } from '@/components/dialogs/password-reset-dialog'
import { useDialog } from '@/components/dialogs/dialog-provider'

export function Dialogs() {
  const { open, setOpen } = useDialog()

  return (
    <>
      <PasswordResetDialog
        open={open === 'passwordReset'}
        onOpenChange={() => setOpen(null)}
      />
    </>
  )
}
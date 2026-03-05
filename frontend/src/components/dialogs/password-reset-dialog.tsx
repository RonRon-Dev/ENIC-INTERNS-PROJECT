'use client'

import { KeyRound, ShieldCheck } from 'lucide-react'
import { ConfirmDialog } from '../confirm-dialog'

type PasswordResetDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PasswordResetDialog({ open, onOpenChange }: PasswordResetDialogProps) {
  const handleReset = () => {
    onOpenChange(false)
    // navigate to password reset page/flow
  }

  return (
    <ConfirmDialog
      open={open}
      hideCancel = {true}
      onOpenChange={onOpenChange}
      handleConfirm={handleReset}
      confirmText='Update Password'
      title={
        <span className='flex items-center gap-2'>
          <KeyRound className='h-4 w-4 text-teal-600' />
          Reset Your Password
        </span>
      }
      desc={
        <div className='flex flex-col items-center gap-4 py-2 text-center'>
          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-teal-100/40 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800'>
            <KeyRound className='h-6 w-6 text-teal-600 dark:text-teal-400' />
          </div>
          <p className='text-sm text-muted-foreground leading-relaxed max-w-xs'>
            For your account's security, we recommend setting a strong,
            unique password that you don't use elsewhere.
          </p>
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <ShieldCheck className='h-3.5 w-3.5' />
            <span>Your session is secure</span>
          </div>
        </div>
      }
    />
  )
}
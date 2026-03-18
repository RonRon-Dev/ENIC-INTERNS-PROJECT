'use client'

import { useAuth } from '@/auth-context'
import { PasswordInput } from "@/components/password-input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { authenticationApi } from '@/services/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, KeyRound, Minus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ConfirmDialog } from '../confirm-dialog'

const passwordRules = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One number', test: (v: string) => /[0-9]/.test(v) },
  { label: 'One special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

// inside the component, watch password:
const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

type PasswordResetDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PasswordResetDialog({ open, onOpenChange }: PasswordResetDialogProps) {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })
  const password = form.watch('password')

  const handleReset = () => {
    form.handleSubmit(async (values) => {
      if (!user) return
      try {
        setLoading(true)
        setServerError(null)
        const res = await authenticationApi.updatePassword(user.userName, values.password)
        if (res?.success === false) {
          setServerError(res.message ?? 'Failed to update password.')
          return
        }
        setUser({ ...user, forcePasswordChange: false })
        onOpenChange(false)
        form.reset()
      } catch {
        setServerError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    })()
  }

  return (
    <ConfirmDialog
      open={open}
      hideCancel
      onOpenChange={onOpenChange}
      handleConfirm={handleReset}
      confirmText={loading ? 'Updating…' : 'Update Password'}
      isLoading={loading}
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
          <Form {...form}>
            <form className='text-left w-3/4' onSubmit={(e) => { e.preventDefault(); handleReset() }}>
              <div className='flex flex-col gap-3'>
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} />
                      </FormControl>
                      {form.formState.dirtyFields.password && (
                        <div className="mt-2 space-y-1">
                          {passwordRules.map(({ label, test }) => {
                            const passed = test(password ?? '')
                            return (
                              <div key={label} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-success' : 'text-muted-foreground'}`}>
                                {passed
                                  ? <Check className="size-3 shrink-0" />
                                  : <Minus className="size-3 shrink-0" />
                                }
                                {label}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm</FormLabel>
                      <FormControl>
                        <PasswordInput
                          disabled={!form.formState.dirtyFields.password}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
          {serverError && (
            <p className='text-xs text-destructive'>{serverError}</p>
          )}
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <ShieldCheck className='h-3.5 w-3.5' />
            <span>Your session is secure</span>
          </div>
        </div>
      }
    >

    </ConfirmDialog>
  )
}

'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { SelectDropdown } from '@/components/select-dropdown'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { type User } from '@/data/schema'
import { notifToast } from '@/lib/notifToast'
import NProgress from '@/lib/nprogress'
import { usersApi } from '@/services/users'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Check, Copy, UserCheck, UserX } from 'lucide-react'
import nProgress from 'nprogress'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Textarea } from '../ui/textarea'
import { useUsers } from './users-provider'

const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required.').transform((val) => val.toLowerCase().trim()),
    username: z.string().min(1, 'Username is required.'),
    role: z.string().min(1, 'Role is required.'),
    isEdit: z.boolean(),
    isResetPassword: z.boolean(),
  })
type UserForm = z.infer<typeof formSchema>

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const isEdit = !!currentRow
  const form = useForm<UserForm>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? { ...currentRow, isEdit, isResetPassword: false }
      : { name: '', username: '', role: '', isEdit, isResetPassword: false },
  })

  const { apiRoles, refresh } = useUsers()
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const resetState = () => {
    form.reset(isEdit
      ? { ...currentRow, isEdit, isResetPassword: false }
      : { name: '', username: '', role: '', isEdit, isResetPassword: false }
    )
    setTempPassword(null)
    // setError(null)
    setCopied(false)
    setCopiedCredentials(false)
    setIsSubmitting(false)
    setCountdown(0)
    setResetKey((k) => k + 1)
  }

  useEffect(() => {
    if (!open) return
    form.reset(isEdit
      ? { ...currentRow, isEdit, isResetPassword: false }
      : { name: '', username: '', role: '', isEdit, isResetPassword: false }
    )
    // setError(null)
    setTempPassword(null)
    setCopied(false)
    setCopiedCredentials(false)
    setCountdown(0)
    setResetKey((k) => k + 1)
  }, [open])

  const [countdown, setCountdown] = useState(0)

  // Add this effect right after the existing useEffect
  useEffect(() => {
    if (!tempPassword) return
    setCountdown(3)
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [tempPassword])

  const onSubmit = async (values: UserForm) => {
    if (isEdit) {
      setIsSubmitting(true)
      // setError(null)
      try {
        const apiRole = apiRoles.find(r => r.name.toLowerCase() === values.role.toLowerCase())
        if (!apiRole) {
          // setError('Role not found.'); 
          return
        }
        await usersApi.assignRole(parseInt(currentRow!.id), apiRole.id)
        refresh()
        form.reset()
        onOpenChange(false)
        notifToast({ name: values.name, role: values.role }, 'edit')
      } catch (err: any) {
        // setError(err?.response?.data?.message ?? 'Failed to update user.')
        notifToast({ reason: err?.response?.data?.message ?? 'Failed to update user.' }, 'error')
      } finally {
        setIsSubmitting(false)
      }
      return
    }
    setIsSubmitting(true)
    // setError(null)
    try {
      NProgress.start();
      const apiRole = apiRoles.find(r => r.name.toLowerCase() === values.role.toLowerCase())
      if (!apiRole) {
        // setError('Role not found. Please try again.');
        return
      }
      const res = await usersApi.createUser({
        name: values.name,
        userName: values.username,
        roleId: apiRole.id,
      })
      setTempPassword(res.data.tempPassword)
      notifToast({ name: values.name, role: values.role }, 'create')
      refresh()
    } catch (err: any) {
      // setError(err?.response?.data?.errors?.UserName?.[0] ?? 'Failed to create user.')
      notifToast({ reason: err?.response?.data?.errors?.UserName?.[0] ?? 'Failed to create user.' }, 'error')
    } finally {
      NProgress.done();
      setIsSubmitting(false)
    }
  }

  const fullName = form.watch('name')

  useEffect(() => {
    if (isEdit) return
    if (fullName?.trim()) {
      const names = fullName.toLowerCase().trim().split(/\s+/)
      const generated = names.length >= 2
        ? `${names[0].charAt(0)}.${names[names.length - 1]}`
        : names[0]
      form.setValue('username', generated)
    } else {
      form.setValue('username', '')
    }
  }, [fullName, isEdit, form])

  const copyUsername = () => {
    const username = form.getValues('username')
    if (!username) return
    navigator.clipboard.writeText(username)
    notifToast({ reason: 'Username saved to clipboard' }, 'copy')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const [copiedCredentials, setCopiedCredentials] = useState(false)

  const copyCredentials = () => {
    if (!tempPassword) return
    const username = form.getValues('username')
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${tempPassword}`)
    notifToast({ reason: 'Credentials saved to clipboard' }, 'copy')
    setCopiedCredentials(true)
    setTimeout(() => setCopiedCredentials(false), 2000)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) resetState()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the user here. ' : 'Create new user here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          {tempPassword ? (
            <div className='space-y-4'>
              <div className='relative space-y-2 rounded-md border bg-muted/50 p-4 text-sm'>
                <button
                  type='button'
                  onClick={copyCredentials}
                  className='absolute top-2 right-2 p-1 hover:bg-background rounded transition-colors'
                >
                  {copiedCredentials
                    ? <Check className='h-4 w-4 text-green-600' />
                    : <Copy className='h-4 w-4 text-muted-foreground' />
                  }
                </button>
                <div className='flex flex-col items-center'>
                  <span className='text-muted-foreground'>Username</span>
                  <span className='font-mono font-medium'>{form.getValues('username')}</span>
                </div>
                <div className='flex flex-col items-center'>
                  <span className='text-muted-foreground'>Temporary Password</span>
                  <span className='font-mono font-bold tracking-widest'>{tempPassword}</span>
                </div>
              </div>
              <Alert className='border-green-600 text-green-600 bg-green-500/10'>
                <UserCheck className='h-5 w-5 stroke-green-600 flex items-center' />
                <AlertTitle className='font-bold'>User Created Successfully</AlertTitle>
                <AlertDescription className='text-green-600' >
                  Share these credentials with the user via a secure channel.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Form {...form}>
              <form
                id='user-form'
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4 px-0.5'
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end'>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='John Doe'
                          className={'col-span-4 capitalize'}
                          // readOnly={isEdit}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='username'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end'>Username</FormLabel>
                      <FormControl>
                        <div className='col-span-3 relative'>
                          <Input
                            className='bg-muted/50 font-mono text-primary pr-10'
                            // readOnly={isEdit}
                            {...field}
                            onChange={(e) => {
                              // if (isEdit) return
                              field.onChange(e.target.value.replace(/\s/g, '').toLowerCase())
                            }}
                          />
                          <button
                            type='button'
                            onClick={copyUsername}
                            className='absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded transition-colors'
                          >
                            {copied
                              ? <Check className='h-4 w-4 text-green-600' />
                              : <Copy className='h-4 w-4 text-muted-foreground' />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end'>Role</FormLabel>
                      <SelectDropdown
                        key={resetKey}
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select a role'
                        className='col-span-3'
                        items={apiRoles.map((r) => ({
                          label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
                          value: r.name.toLowerCase(),
                        }))}
                      />
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
          {/* {error && (
            <div className='w-full flex justify-center'>
              <Alert variant='destructive' className='w-[80%] text-center mt-2'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )} */}
        </div>
        <DialogFooter>

          {isEdit && !tempPassword && (
            <Button
              type='button'
              variant='outline'
              disabled={!form.formState.isDirty}
              onClick={() => { form.reset(); setResetKey((k) => k + 1) }}
            >
              Reset changes
            </Button>
          )}
          <Button
            type={tempPassword ? 'button' : 'submit'}
            form='user-form'
            disabled={isSubmitting || (isEdit && (!form.formState.isValid || !form.formState.isDirty)) || countdown > 0}
            onClick={tempPassword ? () => { resetState(); onOpenChange(false) } : undefined}
          >
            {tempPassword
              ? countdown > 0 ? `Done (${countdown})` : 'Done'
              : isSubmitting ? 'Saving...'
                : isEdit ? 'Save changes'
                  : 'Create user'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type UserDeactivateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeactivateDialog({
  open,
  onOpenChange,
  currentRow,
}: UserDeactivateDialogProps) {
  const { refresh } = useUsers()
  const [value, setValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDeactivate = async () => {
    if (value.trim() !== currentRow.username) return
    setIsSubmitting(true)
    try {
      nProgress.start()
      await usersApi.disableUser(parseInt(currentRow.id))
      notifToast({ name: currentRow.name, role: currentRow.role }, 'deactivate')
      refresh()
      onOpenChange(false)
    } catch (err) {
      toast.error('Failed to deactivate user.')
      console.error('Failed to deactivate user:', err)
    } finally {
      nProgress.done()
      setIsSubmitting(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDeactivate}
      disabled={value.trim() !== currentRow.username || isSubmitting}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Deactivate User
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to deactivate{' '}
            <span className='font-bold'>{currentRow.username}</span>?
            <br />
            This action will deactivate the user with the role of{' '}
            <span className='font-bold'>
              {currentRow.role.toUpperCase()}
            </span>{' '}
            from the system. This cannot be undone.
          </p>

          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Enter username to confirm deactivation.'
            className='mt-2'
          />

          {/* <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert> */}
        </div>
      }
      confirmText='Deactivate'
      destructive
    />
  )
}

type UserActivateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersActivateDialog({
  open,
  onOpenChange,
  currentRow,
}: UserActivateDialogProps) {
  const { refresh } = useUsers()
  const [value, setValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleActivate = async () => {
    if (value.trim() !== currentRow.username) return
    setIsSubmitting(true)
    try {
      nProgress.start()
      await usersApi.enableUser(parseInt(currentRow.id))
      notifToast({ name: currentRow.name, role: currentRow.role }, 'activate')
      refresh()
      onOpenChange(false)
    } catch (err) {
      toast.error('Failed to activate user.')
      console.error('Failed to activate user:', err)
    } finally {
      nProgress.done()
      setIsSubmitting(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleActivate}
      disabled={value.trim() !== currentRow.username || isSubmitting}
      title={
        <span className='text-green-600'>
          <AlertTriangle
            className='me-1 inline-block stroke-green-600'
            size={18}
          />{' '}
          Activate User
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to activate{' '}
            <span className='font-bold'>{currentRow.username}</span>?
            <br />
            This action will activate the user with the role of{' '}
            <span className='font-bold'>
              {currentRow.role.toUpperCase()}
            </span>{' '}
            from the system. This cannot be undone.
          </p>

          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Enter username to confirm activation.'
            className='mt-2'
          />

          {/* <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert> */}
        </div>
      }
      confirmText='Activate'
      destructive={false}
    />
  )
}

type UserApproveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersApproveDialog({
  open,
  onOpenChange,
  currentRow,
}: UserApproveDialogProps) {
  const { apiRoles, refresh } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { role: '', name: '', username: '', isEdit: false, isResetPassword: false },
  })

  const selectedRole = form.watch('role')

  const handleApprove = async () => {
    const roleName = form.getValues('role')
    const apiRole = apiRoles.find(r => r.name.toLowerCase() === roleName.toLowerCase())
    if (!apiRole) { setErrorMsg('Please select a valid role.'); return }
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      NProgress.start()
      await usersApi.approveRegistration(parseInt(currentRow.id), apiRole.id)
      notifToast({ name: currentRow.name, role: roleName }, 'approve')
      form.reset()
      refresh()
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? 'Failed to approve user.')
      toast.error('Failed to approve user.')
    } finally {
      NProgress.done()
      setIsSubmitting(false)
    }
  }

  const onSubmit = () => handleApprove()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleApprove}
      disabled={!selectedRole || isSubmitting}
      title={
        <span className='text-green-600'>
          <UserCheck
            className='me-1 inline-block stroke-green-600'
            size={18}
          />{' '}
          Approve User Request
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            Are you sure you want to approve{' '}
            <span className='font-bold'>{currentRow.name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</span> with username <span className='font-bold'>{currentRow.username}</span>?
            <br />
            This will grant them access to the system.
          </p>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select a role'
                      className='col-span-6'
                      items={apiRoles.map((r) => ({
                        label: r.name,
                        value: r.name,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          {errorMsg && (
            <Alert variant='destructive'>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
          <Alert>
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              The user will be notified and granted access immediately.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={isSubmitting ? 'Approving...' : 'Approve'}
    />
  )
}

type UserRejectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersRejectDialog({
  open,
  onOpenChange,
  currentRow,
}: UserRejectDialogProps) {
  const [reason, setReason] = useState('')

  const handleReject = () => {
    onOpenChange(false)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      disabled={!reason}
      handleConfirm={handleReject}
      title={
        <span className='text-destructive'>
          <UserX
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Reject User Request
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            Are you sure you want to reject{' '}
            <span className='font-bold'>{currentRow.username}</span>'s request?
            <br />
            This action will deny their access to the system.
          </p>
          <Textarea
            className='h-20'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Reason for rejection'
          />
          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              The user will be notified of the rejection.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Reject'
      destructive
    />
  )
}

type UserApproveResetDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersApproveResetDialog({
  open,
  onOpenChange,
  currentRow,
}: UserApproveResetDialogProps) {
  const { refresh } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleApprove = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      NProgress.start()
      const res = await usersApi.approveResetPassword(currentRow.username)
      setTempPassword(res.data.temporaryPassword)
      refresh()
      notifToast({ name: currentRow.username }, 'approveReset')
    } catch (err: any) {
      toast.error('Failed to approve password reset.')
      setErrorMsg(err?.response?.data?.message ?? 'Failed to approve reset.')
    } finally {
      setIsSubmitting(false)
      NProgress.done()
    }
  }

  const handleCopy = () => {
    if (!tempPassword) return
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(state) => {
        if (!state) { setTempPassword(null); setErrorMsg(null) }
        onOpenChange(state)
      }}
      handleConfirm={tempPassword ? () => onOpenChange(false) : handleApprove}
      disabled={isSubmitting}
      title={
        <span className='text-yellow-600'>
          <UserCheck className='me-1 inline-block stroke-yellow-600' size={18} />{' '}
          Approve Password Reset
        </span>
      }
      desc={
        <div className='space-y-4'>
          {!tempPassword ? (
            <p>
              Approve password reset for <span className='font-bold'>{currentRow.username}</span>?
              <br />A temporary password will be generated for you to share with the user.
            </p>
          ) : (
            <div className='space-y-3'>
              <p>Password reset approved. Share this temporary password with <span className='font-bold'>{currentRow.username}</span>:</p>
              <div className='flex items-center gap-2 rounded-md border bg-muted px-3 py-2'>
                <span className='flex-1 font-mono text-base font-bold tracking-widest'>{tempPassword}</span>
                <button type='button' onClick={handleCopy} className='p-1 hover:bg-background rounded transition-colors'>
                  {copied ? <Check className='h-4 w-4 text-green-600' /> : <Copy className='h-4 w-4 text-muted-foreground' />}
                </button>
              </div>
              <Alert>
                <AlertDescription>The user must change this password on next login.</AlertDescription>
              </Alert>
            </div>
          )}
          {errorMsg && (
            <Alert variant='destructive'>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
        </div>
      }
      confirmText={tempPassword ? 'Done' : isSubmitting ? 'Processing...' : 'Approve Reset'}
    />
  )
}

type UserAdminResetDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersAdminResetDialog({
  open,
  onOpenChange,
  currentRow,
}: UserAdminResetDialogProps) {
  const { refresh } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleReset = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const res = await usersApi.adminResetPassword(Number(currentRow.id))
      setTempPassword(res.data.temporaryPassword)
      refresh()
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? 'Failed to reset password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = () => {
    if (!tempPassword) return
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(state) => {
        if (!state) { setTempPassword(null); setErrorMsg(null) }
        onOpenChange(state)
      }}
      handleConfirm={tempPassword ? () => onOpenChange(false) : handleReset}
      disabled={isSubmitting}
      title={
        <span className='text-yellow-600'>
          <UserCheck className='me-1 inline-block stroke-yellow-600' size={18} />{' '}
          Reset User Password
        </span>
      }
      desc={
        <div className='space-y-4'>
          {!tempPassword ? (
            <p>
              Reset password for <span className='font-bold'>{currentRow.username}</span>?
              <br />A temporary password will be generated. The user must change it on next login.
            </p>
          ) : (
            <div className='space-y-3'>
              <p>Password reset. Share this temporary password with <span className='font-bold'>{currentRow.username}</span>:</p>
              <div className='flex items-center gap-2 rounded-md border bg-muted px-3 py-2'>
                <span className='flex-1 font-mono text-base font-bold tracking-widest'>{tempPassword}</span>
                <button type='button' onClick={handleCopy} className='p-1 hover:bg-background rounded transition-colors'>
                  {copied ? <Check className='h-4 w-4 text-green-600' /> : <Copy className='h-4 w-4 text-muted-foreground' />}
                </button>
              </div>
              <Alert>
                <AlertDescription>The user must change this password on next login.</AlertDescription>
              </Alert>
            </div>
          )}
          {errorMsg && (
            <Alert variant='destructive'>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
        </div>
      }
      confirmText={tempPassword ? 'Done' : isSubmitting ? 'Processing...' : 'Reset Password'}
    />
  )
}

type UserUnlockDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersUnlockDialog({
  open,
  onOpenChange,
  currentRow,
}: UserUnlockDialogProps) {
  const { refresh } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleUnlock = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await usersApi.unlockUser(parseInt(currentRow.id))
      refresh()
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? 'Failed to unlock user.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(state) => {
        if (!state) setErrorMsg(null)
        onOpenChange(state)
      }}
      handleConfirm={handleUnlock}
      disabled={isSubmitting}
      title={
        <span className='text-orange-600'>
          <UserCheck className='me-1 inline-block stroke-orange-600' size={18} />{' '}
          Unlock User Account
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            Unlock the account for <span className='font-bold'>{currentRow.username}</span>?
            <br />
            This will clear all failed login attempts and allow the user to log in again.
          </p>
          {errorMsg && (
            <Alert variant='destructive'>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
        </div>
      }
      confirmText={isSubmitting ? 'Unlocking...' : 'Unlock Account'}
    />
  )
}

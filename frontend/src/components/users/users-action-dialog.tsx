'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { SelectDropdown } from '@/components/select-dropdown'
import { AlertTriangle, Check, Copy, UserCheck, UserX } from 'lucide-react'
import { type User } from '@/data/schema'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '../ui/textarea'
import { usersApi } from '@/services/users'
import { useUsers } from './users-provider'

const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required.'),
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
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (values: UserForm) => {
    if (isEdit) {
      setIsSubmitting(true)
      setError(null)
      try {
        const apiRole = apiRoles.find(r => r.name.toLowerCase() === values.role.toLowerCase())
        if (!apiRole) { setError('Role not found.'); return }
        await usersApi.assignRole(parseInt(currentRow!.id), apiRole.id)
        refresh()
        form.reset()
        onOpenChange(false)
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Failed to update user.')
      } finally {
        setIsSubmitting(false)
      }
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const apiRole = apiRoles.find(r => r.name.toLowerCase() === values.role.toLowerCase())
      if (!apiRole) { setError('Role not found. Please try again.'); return }
      const res = await usersApi.createUser({
        name: values.name,
        userName: values.username,
        roleId: apiRole.id,
      })
      setTempPassword(res.data.tempPassword)
      refresh()
    } catch (err: any) {
      setError(err?.response?.data?.errors?.UserName?.[0] ?? 'Failed to create user.')
    } finally {
      setIsSubmitting(false)
    }
  }
  const fullName = form.watch("name");

  useEffect(() => {
    if (isEdit) return

    if (fullName?.trim()) {
      const names = fullName.toLowerCase().trim().split(/\s+/)
      const generated =
        names.length >= 2
          ? `${names[0].charAt(0)}.${names[names.length - 1]}`
          : names[0]

      form.setValue("username", generated)
    } else {
      form.setValue("username", "")
    }
  }, [fullName, isEdit, form])

  const [copied, setCopied] = useState(false)

  const copyUsername = () => {
    const username = form.getValues('username')
    if (!username) return
    navigator.clipboard.writeText(username)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const [resetKey, setResetKey] = useState(0)

  const handleReset = () => {
    form.reset()
    setResetKey((k) => k + 1)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        setTempPassword(null)
        setError(null)
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
                    <FormLabel className='col-span-2 text-end'>
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='John Doe'
                        className={'col-span-4 capitalize' + (isEdit ? ' bg-muted/50' : '')}
                        readOnly={isEdit}
                        // autoComplete='off'
                        {...field}
                      // value={fullName}
                      // onChange={(e) => setFullName(e.target.value)}
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
                          // placeholder='auto-generated'
                          className='bg-muted/50 font-mono text-primary pr-10'
                          // readOnly={!isEdit}
                          readOnly={isEdit}
                          {...field}
                          onChange={(e) => {
                            if (isEdit) return
                            let value = e.target.value
                            value = value.replace(/\s/g, '').toLowerCase()
                            field.onChange(value)
                          }}
                        />
                        {/* {!isEdit && ( */}
                        <button
                          type='button'
                          onClick={copyUsername}
                          className='absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded transition-colors'
                        >
                          {copied
                            ? <Check className='h-4 w-4 text-green-600' />
                            : <Copy className='h-4 w-4 text-muted-foreground' />}
                        </button>
                        {/* )} */}
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
                        value: r.name,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

            </form>
          </Form>
        </div>
        <DialogFooter>
          {tempPassword && (
            <Alert className='w-full text-left mb-2'>
              <AlertTitle>User Created</AlertTitle>
              <AlertDescription>
                Temporary password: <span className='font-mono font-bold'>{tempPassword}</span>
                <br />Share this with the user via secure channel.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant='destructive' className='w-full text-left mb-2'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isEdit && (
            <Button
              type='button'
              variant='outline'
              disabled={!form.formState.isDirty}
              onClick={handleReset}
            >
              Reset changes
            </Button>
          )}
          <Button
            type={tempPassword ? 'button' : 'submit'}
            form='user-form'
            disabled={isSubmitting || (isEdit && (!form.formState.isValid || !form.formState.isDirty))}
            onClick={tempPassword ? () => { form.reset(); setTempPassword(null); onOpenChange(false) } : undefined}
          >
            {tempPassword ? 'Done' : isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create user'}
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
      await usersApi.disableUser(parseInt(currentRow.id))
      refresh()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to deactivate user:', err)
    } finally {
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
      await usersApi.enableUser(parseInt(currentRow.id))
      refresh()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to activate user:', err)
    } finally {
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
      await usersApi.approveRegistration(parseInt(currentRow.id), apiRole.id)
      form.reset()
      refresh()
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? 'Failed to approve user.')
    } finally {
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
      const res = await usersApi.approveResetPassword(currentRow.username)
      setTempPassword(res.data.temporaryPassword)
      refresh()
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? 'Failed to approve reset.')
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
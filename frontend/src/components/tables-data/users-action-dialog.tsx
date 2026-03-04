'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/lib/show-submitted-data'
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
import { roles } from '@/data/const'
import { type User } from '@/data/schema'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'

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

  const onSubmit = (values: UserForm) => {
    form.reset()
    showSubmittedData(values, isEdit ? 'edit' : 'create')
    onOpenChange(false)
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
                      items={roles.map(({ label, value, icon: Icon }) => ({
                        label: (
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>
                              {label.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())}
                            </span>
                          </div>
                        ),
                        value,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {isEdit && (
                <FormField
                  control={form.control}
                  name='isResetPassword'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end'>Reset Password</FormLabel>
                      <FormControl>
                        <div className='col-span-3 flex items-center gap-2'>
                          <Checkbox
                            id='reset-password'
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(!!checked)}
                          />
                          <label htmlFor='reset-password' className='text-sm cursor-pointer text-muted-foreground'>
                            Set a new password
                          </label>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>
        <DialogFooter>
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
            type='submit'
            form='user-form'
            disabled={isEdit && (!form.formState.isValid || !form.formState.isDirty)}
          >
            {isEdit ? 'Save changes' : 'Create user'}
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
  const [value, setValue] = useState('')

  const handleDeactivate = () => {
    if (value.trim() !== currentRow.username) return

    onOpenChange(false)
    showSubmittedData(currentRow, 'deactivate')
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDeactivate}
      disabled={value.trim() !== currentRow.username}
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
  const [value, setValue] = useState('')

  const handleActivate = () => {
    if (value.trim() !== currentRow.username) return

    onOpenChange(false)
    showSubmittedData(currentRow, 'activate')
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleActivate}
      disabled={value.trim() !== currentRow.username}
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
  const handleApprove = () => {
    onOpenChange(false)
    showSubmittedData(currentRow, 'approve')
  }

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: '',
    },
  })

  const onSubmit = (values: UserForm) => {
    form.reset()
    showSubmittedData(values, 'approve')
    onOpenChange(false)
  }

  const selectedRole = form.watch('role')

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleApprove}
      disabled={!selectedRole}
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
                    {/* <FormLabel className='col-span-2 text-end'>Role</FormLabel> */}
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select a role'
                      className='col-span-6'
                      items={roles.map(({ label, value, icon: Icon }) => ({
                        label: (
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>
                              {label.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())}
                            </span>
                          </div>
                        ),
                        value,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <Alert>
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              The user will be notified and granted access immediately.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Approve'
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
    showSubmittedData({ ...currentRow, reason }, 'reject')
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
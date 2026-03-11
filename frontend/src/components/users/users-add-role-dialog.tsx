import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
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
import { notifToast } from '@/lib/notifToast'
import { cn } from '@/lib/utils'
import { usersApi } from '@/services/users'
import { zodResolver } from '@hookform/resolvers/zod'
import { Code, Cpu, FileText, Megaphone, Settings, Shield, ShieldCheck, ShieldPlus, User, UserCheck, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useUsers } from './users-provider'

const availableIcons = [
  { label: 'User', value: 'user', icon: User },
  { label: 'Shield', value: 'shield', icon: Shield },
  { label: 'ShieldCheck', value: 'shieldcheck', icon: ShieldCheck },
  { label: 'UserCheck', value: 'usercheck', icon: UserCheck },
  { label: 'Code', value: 'code', icon: Code },
  { label: 'Settings', value: 'settings', icon: Settings },
  { label: 'Megaphone', value: 'megaphone', icon: Megaphone },
  { label: 'Users', value: 'users', icon: Users },
  { label: 'FileText', value: 'filetext', icon: FileText },
  { label: 'Cpu', value: 'cpu', icon: Cpu },
]

const formSchema = z.object({
  name: z.string().min(1, 'Role name is required.'),
  icon: z.string().min(1, 'Please select an icon.'),
})

type UserAddRoleForm = z.infer<typeof formSchema>

type UserAddRoleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersAddRoleDialog({ open, onOpenChange }: UserAddRoleDialogProps) {
  const form = useForm<UserAddRoleForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', icon: '' },
  })
  const { refreshRoles } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // const [error, setError] = useState<string | null>(null)

  const onSubmit = async (values: UserAddRoleForm) => {
    setIsSubmitting(true)
    try {
      const res = await usersApi.createRole(values.name.trim())
      if (!res.data.success) {
        notifToast({ reason: res.data.message }, 'error')
        return
      }
      await refreshRoles()
      notifToast(values, 'addrole')
      form.reset()
      onOpenChange(false)
    } catch (err) {
      notifToast({
        reason: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create role.'
      }, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        // setError(null)
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <ShieldPlus /> Add Role
          </DialogTitle>
          <DialogDescription>
            Create a new role to define a set of permissions and access levels
            within the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='user-add-role-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder='eg: Admin' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='icon'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <div className='grid grid-cols-5 gap-2'>
                      {availableIcons.map(({ value, icon: Icon }) => (
                        <Button
                          key={value.toLowerCase()}
                          type='button'
                          onClick={() => field.onChange(value)}
                          variant='outline'
                          className={cn(
                            'flex flex-col items-center justify-center gap-1 rounded-md border p-3 text-xs transition-colors hover:border-gray-500',
                            field.value === value
                              ? 'hover:bg-muted/60 cursor-pointer border-gray-500'
                              : 'border-input text-muted-foreground'
                          )}
                        >
                          <Icon size={20} />
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        {/* {error && (
          <div className='w-full flex justify-center'>
            <Alert variant='destructive' className='w-[80%] text-center mt-2'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )} */}
        <DialogFooter className='gap-y-2'>
          <DialogClose asChild>
            <Button variant='outline' disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button type='submit' form='user-add-role-form' disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Role'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
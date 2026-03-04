import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldPlus, Shield, UserCheck, User, ShieldCheck, Code, Megaphone, Settings, Users, FileText, Cpu } from 'lucide-react'
import { showSubmittedData } from '@/lib/show-submitted-data'
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
import { roles } from '@/data/const'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const existingRoleValues = roles.map((r) => r.value)

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
  name: z
    .string()
    .min(1, 'Role name is required.')
    .refine(
      (val) => !existingRoleValues.includes(val.toLowerCase() as typeof existingRoleValues[number]),
      { message: 'This role already exists.' }
    ),
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

  const onSubmit = (values: UserAddRoleForm) => {
    form.reset()
    showSubmittedData(values, 'addrole')
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
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
                    <Input placeholder='eg: editor' {...field} />
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
                          variant={"outline"}
                          className={cn(
                            'flex flex-col items-center justify-center gap-1 rounded-md border p-3 text-xs transition-colors hover:border-gray-500',
                            field.value === value
                              ? "hover:bg-muted/60 cursor-pointer border-gray-500"
                              : 'border-input text-muted-foreground'
                          )}
                        >
                          <Icon size={20} />
                          {/* <span className='line-clamp-1'>{label}</span> */}
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
        <DialogFooter className='gap-y-2'>
          <DialogClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DialogClose>
          <Button type='submit' form='user-add-role-form'>
            Add Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
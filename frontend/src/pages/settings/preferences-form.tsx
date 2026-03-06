import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { showSubmittedData } from '@/lib/show-submitted-data'

const timeoutOptions = [
  { label: '5 minutes', value: '5' },
  { label: '10 minutes', value: '10' },
  { label: '15 minutes', value: '15' },
  { label: '30 minutes', value: '30' },
  { label: '45 minutes', value: '45' },
  { label: '1 hour', value: '60' },
] as const

const preferencesFormSchema = z.object({
  theme: z.enum(['light', 'dark']),
  timeout: z.enum(['5', '10', '15', '30', '45', '60']),
})

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>

export function PreferencesForm() {
  const { theme, setTheme } = useTheme()

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      theme: (theme as 'light' | 'dark') ?? 'light',
      timeout: '15',
    },
  })

  function onSubmit(data: PreferencesFormValues) {
    setTheme(data.theme)
    showSubmittedData(data, 'appsettings')
    form.reset(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>

        {/* Session Timeout */}
        <FormField
          control={form.control}
          name='timeout'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Session Timeout</FormLabel>
              <FormDescription>
                Automatically log out after a period of inactivity.
              </FormDescription>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className='w-48'>
                    <SelectValue placeholder='Select timeout' defaultValue={timeoutOptions[1].label} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timeoutOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Theme Picker */}
        <FormField
          control={form.control}
          name='theme'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Theme</FormLabel>
              <FormDescription>Select the theme for the dashboard.</FormDescription>
              <FormMessage />
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className='grid max-w-md grid-cols-2 gap-8 pt-2'
              >
                {/* Light */}
                <FormItem>
                  <FormLabel className='[&:has([data-state=checked])>div]:border-primary'>
                    <FormControl>
                      <RadioGroupItem value='light' className='sr-only' />
                    </FormControl>
                    <div className='items-center rounded-md border-2 border-muted p-1 hover:border-accent'>
                      <div className='space-y-2 rounded-sm bg-[#ecedef] p-2'>
                        <div className='space-y-2 rounded-md bg-white p-2 shadow-xs'>
                          <div className='h-2 w-[80px] rounded-lg bg-[#ecedef]' />
                          <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                        </div>
                        <div className='flex items-center space-x-2 rounded-md bg-white p-2 shadow-xs'>
                          <div className='h-4 w-4 rounded-full bg-[#ecedef]' />
                          <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                        </div>
                      </div>
                    </div>
                    <span className='block w-full p-2 text-center font-normal'>Light</span>
                  </FormLabel>
                </FormItem>

                {/* Dark */}
                <FormItem>
                  <FormLabel className='[&:has([data-state=checked])>div]:border-primary'>
                    <FormControl>
                      <RadioGroupItem value='dark' className='sr-only' />
                    </FormControl>
                    <div className='items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground'>
                      <div className='space-y-2 rounded-sm bg-slate-950 p-2'>
                        <div className='space-y-2 rounded-md bg-slate-800 p-2 shadow-xs'>
                          <div className='h-2 w-[80px] rounded-lg bg-slate-400' />
                          <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                        </div>
                        <div className='flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-xs'>
                          <div className='h-4 w-4 rounded-full bg-slate-400' />
                          <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                        </div>
                      </div>
                    </div>
                    <span className='block w-full p-2 text-center font-normal'>Dark</span>
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />

        <Button
          type='submit'
          disabled={!form.formState.isDirty}
        >Update display</Button>
      </form>
    </Form>
  )
}
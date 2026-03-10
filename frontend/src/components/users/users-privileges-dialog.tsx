import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { roles } from '@/data/const'
import { toolsData } from '@/data/tools'
import { notifToast } from '@/lib/notifToast'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronDown, ChevronRight, Minus, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PageEntry = {
  title: string
  url: string
  allowedRoles: string[]
  parent?: string
}

type Category = {
  title: string
  url?: string
  allowedRoles: string[]
  children: PageEntry[]
}

function buildCategories(): Category[] {
  return toolsData.map((tool) => ({
    title: tool.title,
    url: tool.url,
    allowedRoles: tool.allowedRoles ?? [],
    children: (tool.subtools ?? [])
      .filter((s) => !!s.url)
      .map((s) => ({
        title: s.title,
        url: s.url!,
        allowedRoles: s.allowedRoles ?? [],
        parent: tool.title,
      })),
  }))
}

function flattenPages(): PageEntry[] {
  const pages: PageEntry[] = []
  for (const tool of toolsData) {
    if (tool.url) {
      pages.push({ title: tool.title, url: tool.url, allowedRoles: tool.allowedRoles ?? [] })
    }
    for (const sub of tool.subtools ?? []) {
      if (sub.url) {
        pages.push({ title: sub.title, url: sub.url, allowedRoles: sub.allowedRoles ?? [], parent: tool.title })
      }
    }
  }
  return pages
}

const categories = buildCategories()
const allPages = flattenPages()
const initialPageRoles = Object.fromEntries(
  allPages.map((p) => [p.url, p.allowedRoles.length === 0 ? roles.map((r) => r.value) : p.allowedRoles])
)

const formSchema = z.object({
  allowedRoles: z.array(z.string()),
})

type PrivilegeForm = z.infer<typeof formSchema>

export function UsersPrivilegesDialog({ open, onOpenChange }: Props) {
  const [selected, setSelected] = useState<PageEntry | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const isHome = selected?.url === '/home'
  const homeEntry = categories.find((c) => c.url === '/home')

  const form = useForm<PrivilegeForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { allowedRoles: [] },
  })

  useEffect(() => {
    if (selected) {
      const resolved = selected.allowedRoles.length === 0
        ? roles.map((r) => r.value)
        : selected.allowedRoles
      form.reset({ allowedRoles: resolved })
    }
  }, [selected])

  useEffect(() => {
    if (open && homeEntry) {
      setSelected({ title: homeEntry.title, url: homeEntry.url!, allowedRoles: homeEntry.allowedRoles })
    }
  }, [open])

  const toggleExpand = (title: string) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const isHomeUrl = (url: string) => url === '/home'

  const onSubmit = (data: PrivilegeForm) => {
    const toSave = data.allowedRoles.length === roles.length ? [] : data.allowedRoles
    console.log('Save', selected?.url, toSave)
    form.reset({ allowedRoles: data.allowedRoles })
    notifToast({ name: selected?.title }, 'updateprivileges')
  }


  const matrixForm = useForm<{ pageRoles: Record<string, string[]> }>({
    defaultValues: { pageRoles: { ...initialPageRoles } },
  })

  const isMatrixDirty = matrixForm.formState.isDirty

  const onMatrixSubmit = (data: { pageRoles: Record<string, string[]> }) => {
    console.log('Save matrix', data.pageRoles)
    matrixForm.reset(data) // resets dirty state with new values as baseline
    notifToast({ name: 'Page Matrix' }, 'updateprivileges')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(s) => {
        onOpenChange(s)
        if (!s) {
          setSelected(null)
          setExpanded({})
          form.reset()
          matrixForm.reset({ pageRoles: { ...initialPageRoles } })
        }
      }}
    >
      <DialogContent className='sm:max-w-5xl p-0 gap-0 overflow-hidden flex flex-col'>
        <DialogHeader className='px-6 pt-6 pb-3 border-b'>
          <DialogTitle className='flex items-center gap-2'>
            <ShieldCheck className='size-4' />
            Page Privileges
          </DialogTitle>
          <DialogDescription>
            Manage which roles have access to each page.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue='pages' className='flex flex-col min-h-0 flex-1'>
          <div className='p-3 border-b flex justify-end'>
            <TabsList className='h-9 w-[20%]'>
              <TabsTrigger value='pages' className='text-xs w-full'>By Page</TabsTrigger>
              <TabsTrigger value='matrix' className='text-xs w-full'>Matrix</TabsTrigger>
            </TabsList>
          </div>

          {/* ── By Page tab ── */}
          <TabsContent value='pages' className='flex flex-1 overflow-hidden mt-0'>
            <ScrollArea className='w-2/5 border-r'>
              <div className='p-2 space-y-0.5'>
                {categories.map((cat) => {
                  const isExpanded = expanded[cat.title]
                  const hasChildren = cat.children.length > 0
                  const catEntry: PageEntry | null = cat.url
                    ? { title: cat.title, url: cat.url, allowedRoles: cat.allowedRoles }
                    : null

                  return (
                    <div key={cat.title}>
                      <button
                        type='button'
                        onClick={() => {
                          if (hasChildren) toggleExpand(cat.title)
                          if (catEntry) setSelected(catEntry)
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between gap-2',
                          selected?.url === cat.url && cat.url
                            ? 'bg-muted text-foreground'
                            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span className='font-medium'>{cat.title}</span>
                        {hasChildren && (
                          isExpanded
                            ? <ChevronDown className='size-3.5 shrink-0' />
                            : <ChevronRight className='size-3.5 shrink-0' />
                        )}
                      </button>

                      {hasChildren && isExpanded && (
                        <div className='ml-3 pl-2 border-l space-y-0.5 mt-0.5 mb-1'>
                          {cat.children.map((child) => (
                            <button
                              key={child.url}
                              type='button'
                              onClick={() => setSelected(child)}
                              className={cn(
                                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex flex-col',
                                selected?.url === child.url
                                  ? 'bg-muted text-foreground'
                                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                              )}
                            >
                              <span>{child.title}</span>
                              <span className='text-xs font-mono text-muted-foreground'>{child.url}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className='flex-1 flex flex-col'>
              {selected ? (
                <Form {...form}>
                  <form
                    id='privileges-form'
                    onSubmit={form.handleSubmit(onSubmit)}
                    className='flex flex-col h-full'
                  >
                    <div className='p-6 flex-1 space-y-4 overflow-auto'>
                      <div>
                        <p className='font-semibold text-sm'>{selected.title}</p>
                        <p className='text-xs text-muted-foreground font-mono'>{selected.url}</p>
                        {isHome && (
                          <p className='text-xs text-muted-foreground mt-1'>All roles have access to this page.</p>
                        )}
                      </div>
                      <FormField
                        control={form.control}
                        name='allowedRoles'
                        render={({ field }) => (
                          <FormItem className='space-y-3'>
                            <FormLabel className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                              Allowed Roles
                            </FormLabel>
                            <FormControl>
                              <div className='space-y-2'>
                                {roles.map(({ value, label, icon: Icon }) => {
                                  const checked = field.value.includes(value)
                                  return (
                                    <div
                                      key={value}
                                      className={cn(
                                        'flex items-center gap-2.5 text-sm',
                                        isHome ? 'cursor-not-allowed' : 'cursor-pointer'
                                      )}
                                      onClick={() => {
                                        if (isHome) return
                                        field.onChange(
                                          checked
                                            ? field.value.filter((r) => r !== value)
                                            : [...field.value, value]
                                        )
                                      }}
                                    >
                                      <div className={cn(
                                        'size-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors',
                                        checked && !isHome ? 'bg-primary border-primary' :
                                          checked && isHome ? 'bg-primary/40 border-primary/40' :
                                            'border-muted-foreground/30'
                                      )}>
                                        {checked && <Check className='size-3 text-primary-foreground' />}
                                      </div>
                                      <Icon className={cn('size-3.5', checked && !isHome ? 'text-foreground' : 'text-muted-foreground/40')} />
                                      <span className={cn('capitalize', checked && !isHome ? 'text-foreground' : 'text-muted-foreground/40')}>
                                        {label}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.formState.isDirty && !isHome && (
                      <div className='flex gap-2 p-4 border-t'>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          className='flex-1'
                          onClick={() => form.reset({ allowedRoles: selected.allowedRoles })}
                        >
                          Reset
                        </Button>
                        <Button type='submit' size='sm' className='flex-1'>
                          Save
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              ) : (
                <div className='h-full flex items-center justify-center text-sm text-muted-foreground'>
                  Select a page to view its privileges
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Matrix tab ── */}
          <TabsContent value='matrix' className='overflow-hidden mt-0 flex flex-col h-full'>
            <Form {...matrixForm}>
              <form
                id='matrix-form'
                onSubmit={matrixForm.handleSubmit(onMatrixSubmit)}
                className='flex flex-col h-full overflow-hidden'
              >
                <div className='overflow-auto flex-1 p-4'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-background'>
                        <TableHead className='sticky top-0 bg-background z-10 text-xs font-medium uppercase tracking-wide min-w-[160px]'>
                          Page
                        </TableHead>
                        {roles.map(({ value, label, icon: Icon }) => (
                          <TableHead key={value} className='sticky top-0 bg-background z-10 text-center p-2'>
                            <div className='flex flex-col items-center gap-1'>
                              <Icon className='size-3.5 text-muted-foreground' />
                              <span className='text-xs font-medium text-muted-foreground capitalize whitespace-nowrap'>{label}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPages.map((page) => (
                        <FormField
                          key={page.url}
                          control={matrixForm.control}
                          name={`pageRoles.${page.url}`}
                          render={({ field }) => (
                            <TableRow>
                              <TableCell className='py-2.5 pr-4'>
                                <div className='flex flex-col'>
                                  {page.parent && (
                                    <span className='text-xs text-muted-foreground'>{page.parent}</span>
                                  )}
                                  <span className={cn('font-medium', page.parent ? 'text-xs' : 'text-sm')}>
                                    {page.title}
                                  </span>
                                </div>
                              </TableCell>
                              {roles.map(({ value }) => {
                                const checked = (field.value ?? []).includes(value)
                                const locked = isHomeUrl(page.url)
                                return (
                                  <TableCell key={value} className='py-2.5 px-2 text-center'>
                                    <div
                                      className={cn(
                                        'size-4 flex items-center justify-center mx-auto transition-colors',
                                        locked ? 'cursor-not-allowed' : 'cursor-pointer',
                                      )}
                                      onClick={() => {
                                        if (locked) return
                                        const current = field.value ?? []
                                        field.onChange(
                                          current.includes(value)
                                            ? current.filter((r) => r !== value)
                                            : [...current, value]
                                        )
                                      }}
                                    >
                                      {checked
                                        ? <Check className={cn('size-3.5', locked ? 'text-success/40' : 'text-success')} />
                                        : <Minus className='size-3.5 text-muted-foreground/20 hover:text-muted-foreground/50' />
                                      }
                                    </div>
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          )}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {isMatrixDirty && (
                  <div className='flex gap-2 p-4 border-t'>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      className='flex-1'
                      onClick={() => matrixForm.reset({ pageRoles: { ...initialPageRoles } })}
                    >
                      Reset
                    </Button>
                    <Button type='submit' form='matrix-form' size='sm' className='flex-1'>
                      Save
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
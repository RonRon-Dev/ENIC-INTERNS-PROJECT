import { KeyRound, MoreHorizontal, Trash2, UserCheck, UserPen, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type User } from '../tables-data/users-column'
import { useUsers } from '@/components/users/users-provider'
import { type CellContext } from '@tanstack/react-table'
import { useAuth } from '@/auth-context'

type DataTableRowActionsProps = CellContext<User, unknown>

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useUsers()
  const { user } = useAuth()
  const isPending = row.original.status === 'pending'
  const isDeactivated = row.original.status === 'deactivated'
  const isSuperadmin = row.original.role === 'superadmin'
  const isSelf = row.original.username === user?.userName

  if (isSuperadmin || isSelf) return null

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
          >
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          {isPending ? (
            <>
              <DropdownMenuItem
                onClick={() => {
                  setCurrentRow(row.original)
                  setOpen('approve')
                }}
                className='text-green-600 focus:text-green-700'
              >
                Approve
                <DropdownMenuShortcut>
                  <UserCheck size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setCurrentRow(row.original)
                  setOpen('reject')
                }}
                className='text-red-500 focus:text-red-600'
              >
                Reject
                <DropdownMenuShortcut>
                  <UserX size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem
                onClick={() => {
                  setCurrentRow(row.original)
                  setOpen('edit')
                }}
              >
                Edit
                <DropdownMenuShortcut>
                  <UserPen size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setCurrentRow(row.original)
                  setOpen('approveReset')
                }}
              >
                Reset Pwd
                <DropdownMenuShortcut>
                  <KeyRound size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isDeactivated ? (
                <DropdownMenuItem
                  onClick={() => {
                    setCurrentRow(row.original)
                    setOpen('activate')
                  }}
                  className='text-green-600 focus:text-green-700'
                >
                  Activate
                  <DropdownMenuShortcut>
                    <UserCheck size={16} />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              ) : (<DropdownMenuItem
                onClick={() => {
                  setCurrentRow(row.original)
                  setOpen('deactivate')
                }}
                className='text-red-500 focus:text-red-600'
              >
                Deactivate
                <DropdownMenuShortcut>
                  <Trash2 size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
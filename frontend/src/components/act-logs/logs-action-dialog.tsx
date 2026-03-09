'use client'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader
} from '@/components/ui/dialog'
import { roles, userTypes } from '@/data/const'
import { type ActivityLog } from '@/data/schema'
import { Avatar, AvatarFallback } from '../ui/avatar'

type DescViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: ActivityLog
}

export function DescViewDialog({
  open,
  onOpenChange,
  currentRow,
}: DescViewDialogProps) {
  const roleConfig = roles.find((r) => r.value === currentRow.user.role)
  const RoleIcon = roleConfig?.icon
  const displayName = currentRow.user.name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg p-0 pb-10'>
        <DialogHeader className='flex-row items-center p-8 pb-2'>
          <Avatar className="h-10 w-10 rounded border bg-muted mr-3 text-muted-foreground p-4">
            <AvatarFallback>
              {displayName.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
              }
            </AvatarFallback>
          </Avatar>
          <div className='flex w-full justify-between'>
            <div className='flex flex-col'>
              <div className='font-bold'>{displayName}</div>
              <div className='font-medium text-muted-foreground text-sm'>{currentRow.user.username}</div>
            </div>
            <div className='flex flex-col items-end gap-2'>


              <Badge className='w-fit gap-x-1 py-1'>
                {RoleIcon && <RoleIcon className='h-4 w-4' />}
                <span>{currentRow.user.role.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</span>
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Description spans full width */}
        <div className='px-10 grid grid-cols-2 border-y py-4 mb-4 gap-y-2'>
          <span className='text-muted-foreground text-sm'>Reference ID</span>
          <span className='text-right text-sm'>{currentRow.id}</span>

          <span className='text-muted-foreground text-sm'>Date & Time</span>
          <span className='text-right text-sm'>
            {new Date(currentRow.date + 'T' + currentRow.time).toLocaleDateString('en-US', {
              year: 'numeric', month: '2-digit', day: '2-digit',
            })}{' '}
            {new Date(currentRow.date + 'T' + currentRow.time).toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit', hour12: true,
            })}
          </span>

          <span className='text-muted-foreground text-sm'>User Status</span>
          <div className='flex justify-end'>
            <div
              className={userTypes.get(currentRow.user.status) + ' w-fit text-sm bg-transparent'}
            >
              {currentRow.user.status.charAt(0).toUpperCase() + currentRow.user.status.slice(1)}
            </div>
          </div>

          <span className='text-muted-foreground text-sm'>Result</span>
          <div className='flex justify-end'>
            <div
              className={`gap-x-1 flex items-center text-sm ${currentRow.isSuccess
                ? 'text-green-600 border-green-600' : 'text-red-500 border-red-500'}
              `}>
              {currentRow.isSuccess ? 'Success' : 'Failed'}
            </div>
          </div>

          <span className='text-muted-foreground text-sm'>Action Taken</span>
          <span className='text-right text-sm break-words'>{currentRow.description}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

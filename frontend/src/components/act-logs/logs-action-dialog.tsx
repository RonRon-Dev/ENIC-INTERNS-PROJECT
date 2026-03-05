'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { type ActivityLog } from '@/data/schema'
import { roles, activityTypes } from '@/data/const'

type DescViewDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentRow: ActivityLog
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className='flex flex-col gap-0.5'>
            <span className='text-xs text-muted-foreground'>{label}</span>
            <div className='text-sm'>{children}</div>
        </div>
    )
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

    const badgeClass = activityTypes.get(currentRow.type)

    const date = new Date(currentRow.date + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    const [hourStr, minute] = currentRow.time.split(':')
    const hour = parseInt(hourStr, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    const time = `${hour12}:${minute} ${ampm}`

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-lg'>
                <DialogHeader className='text-start'>
                    <DialogTitle>Activity Log</DialogTitle>
                    <DialogDescription>
                        Viewing activity details for{' '}
                        <span className='font-medium text-foreground'>{displayName}</span>.
                    </DialogDescription>
                </DialogHeader>

                {/* Description spans full width */}
                <div className='space-y-1.5 py-1'>
                    <p className='text-xs font-semibold uppercase tracking-wider'>Description</p>
                    <p className='text-sm text-muted-foreground leading-relaxed'>
                        {currentRow.description.charAt(0).toUpperCase() + currentRow.description.slice(1)}
                    </p>
                </div>

                <div className='grid grid-row-2 gap-4 py-1'>
                    <div className='space-y-1'>
                        {/* Left — User Info */}
                        <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>User</p>
                        <div className='flex gap-10'>
                            <Field label='Name'>
                                <span className='font-medium'>{displayName}</span>
                            </Field>
                            <Field label='Username'>
                                <span className='font-mono text-sm text-primary'>{currentRow.user.username}</span>
                            </Field>
                            <Field label='Role'>
                                <div className='flex items-center gap-1.5'>
                                    {RoleIcon && <RoleIcon className='h-4 w-4 text-muted-foreground' />}
                                    <span>{currentRow.user.role.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                                </div>
                            </Field>
                            <Field label='Status'>
                                <Badge
                                    variant='outline'
                                    className={
                                        currentRow.user.status === 'active'
                                            ? 'border-green-500 text-green-600'
                                            : currentRow.user.status === 'pending'
                                                ? 'border-yellow-500 text-yellow-600'
                                                : 'border-destructive text-destructive'
                                    }
                                >
                                    {currentRow.user.status.charAt(0).toUpperCase() + currentRow.user.status.slice(1)}
                                </Badge>
                            </Field>
                        </div>
                    </div>

                    <div className='space-y-1'>
                        {/* Right — Activity Info */}
                        <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Activity</p>
                        <div className='flex gap-10'>
                            <Field label='Type'>
                                <Badge variant='outline' className={badgeClass + ' capitalize'}>
                                    {currentRow.type}
                                </Badge>
                            </Field>
                            <Field label='Date'>{date}</Field>
                            <Field label='Time'>{time}</Field>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// function Row({
//     label,
//     children,
// }: {
//     label: string
//     children: React.ReactNode
// }) {
//     return (
//         <div className='grid grid-cols-6 items-start gap-x-4'>
//             <span className='col-span-2 text-end text-sm text-muted-foreground pt-0.5'>
//                 {label}
//             </span>
//             <div className='col-span-4 text-sm'>{children}</div>
//         </div>
//     )
// }
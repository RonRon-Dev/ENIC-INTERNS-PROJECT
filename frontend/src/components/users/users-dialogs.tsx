import { UsersActionDialog, UsersDeactivateDialog, UsersActivateDialog, UsersApproveDialog, UsersRejectDialog, UsersApproveResetDialog, UsersAdminResetDialog, UsersUnlockDialog } from '@/components/users/users-action-dialog'
import { useUsers } from '@/components/users/users-provider'
import { UsersAddRoleDialog } from '@/components/users/users-add-role-dialog'

export function UsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers()
  return (
    <>
      <UsersActionDialog
        key='user-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {/* <UsersInviteDialog
        key='user-invite'
        open={open === 'invite'}
        onOpenChange={() => setOpen('invite')}
      /> */}

      {currentRow && (
        <>
          <UsersActionDialog
            key={`user-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <UsersDeactivateDialog
            key={`user-deactivate-${currentRow.id}`}
            open={open === 'deactivate'}
            onOpenChange={() => {
              setOpen('deactivate')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <UsersActivateDialog
            key={`user-activate-${currentRow.id}`}
            open={open === 'activate'}
            onOpenChange={() => {
              setOpen('activate')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <UsersApproveDialog
            open={open === 'approve'}
            onOpenChange={() => {
              setOpen('approve')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
          <UsersRejectDialog
            open={open === 'reject'}
            onOpenChange={() => {
              setOpen('reject')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
          <UsersApproveResetDialog
            open={open === 'approveReset'}
            onOpenChange={() => {
              setOpen('approveReset')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
          <UsersAdminResetDialog
            open={open === 'adminReset'}
            onOpenChange={() => {
              setOpen('adminReset')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
          <UsersUnlockDialog
            key={`user-unlock-${currentRow.id}`}
            open={open === 'unlock'}
            onOpenChange={() => {
              setOpen('unlock')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
      <UsersAddRoleDialog
        open={open === 'role'}
        onOpenChange={() => setOpen(null)}
      />
    </>
  )
}

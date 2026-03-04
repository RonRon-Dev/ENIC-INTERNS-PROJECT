import { UsersActionDialog, UsersDeactivateDialog, UsersActivateDialog, UsersApproveDialog, UsersRejectDialog } from './users-action-dialog'
import { useUsers } from '@/components/tables-data/users-provider'
import { UsersAddRoleDialog } from './users-add-role-dialog'

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
        </>
      )}
      <UsersAddRoleDialog
        open={open === 'role'}
        onOpenChange={() => setOpen(null)}
      />
    </>
  )
}

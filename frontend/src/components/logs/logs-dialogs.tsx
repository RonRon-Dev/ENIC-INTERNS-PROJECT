import { DescViewDialog } from '@/components/logs/logs-action-dialog'
import { useLogs } from '@/components/logs/logs-provider'

export function LogsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useLogs()
  return (
    <>
      {currentRow && (
        <>
          <DescViewDialog
            key={`user-view-${currentRow.id}`}
            open={open === 'desc'}
            onOpenChange={() => {
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />          
        </>
      )}
    </>
  )
}

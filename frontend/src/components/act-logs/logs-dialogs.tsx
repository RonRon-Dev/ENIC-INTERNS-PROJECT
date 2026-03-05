import { DescViewDialog } from '@/components/act-logs/logs-action-dialog'
import { useLogs } from '@/components/act-logs/logs-provider'

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

import { useEffect, useState } from "react"
import { columns, DataTable } from "@/components/tables-data/activity-logs-column"
import { userlogs } from "@/data/userlogs"
import type { ActivityLog } from "@/data/schema"
    
export default function Dashboard() {
    const [data, setData] = useState<ActivityLog[]>([])

    useEffect(() => {
        async function loadData() {
            const logs = await userlogs()
            setData(logs)
        }

        loadData()
    }, [])

    return (
        <>
            <h1 className='text-2xl font-bold tracking-tight'>Activity Logs</h1>
            <div>
                <DataTable columns={columns} data={data} />
            </div>
        </>
    )
}
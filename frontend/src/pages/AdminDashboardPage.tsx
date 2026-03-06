import { useEffect, useState } from "react"
import { DataTable, useColumns } from '@/components/tables-data/activity-logs-column'
import { getActivityLogs } from "@/services/activity-logs"
import type { ActivityLog } from "@/data/schema"
import { SkeletonTable } from "@/pages/UserManagementPage"
import { LogsProvider } from "@/components/act-logs/logs-provider"
import { LogsDialogs } from "@/components/act-logs/logs-dialogs"


function DashboardContent() {
    const [data, setData] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)
    const columns = useColumns()

    useEffect(() => {
        async function loadData() {
            try {
                const res = await getActivityLogs()
                setData(res.data)
            } catch (err) {
                console.error("Failed to load activity logs:", err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    console.log("Activity Logs Data:", data)

    return (
        <>
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Activity Logs</h2>
                <p className="text-muted-foreground">View your users' activity logs here.</p>
            </div>
            <div>
                {loading ? <SkeletonTable /> : <DataTable columns={columns} data={data} />}
            </div>
            <LogsDialogs />
        </>
    )
}

export default function AdminDashboardPage() {
    return (
        <LogsProvider>
            <DashboardContent />
        </LogsProvider>
    )
}

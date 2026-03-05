import { useEffect, useState } from "react"
import { DataTable, useColumns } from '@/components/tables-data/activity-logs-column'
import { userlogs } from "@/data/userlogs"
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
            const logs = await userlogs()
            setData(logs)
            // setLoading(false)
        }

        loadData()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

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
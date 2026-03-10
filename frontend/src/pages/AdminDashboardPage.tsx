import { LogsDialogs } from "@/components/act-logs/logs-dialogs";
import { LogsProvider } from "@/components/act-logs/logs-provider";
import {
  DataTable,
  useColumns,
} from "@/components/tables-data/activity-logs-column";
import { roles as roleIcons } from "@/data/const";
import { type ActivityLog, type Roles } from "@/data/schema";
import { SkeletonTable } from "@/pages/UserManagementPage";
import { dashboardApi } from "@/services/dashboard";
import { usersApi } from "@/services/users";
import { useEffect, useState } from "react";

function DashboardContent() {
  const [data, setData] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Roles[]>([]);
  const columns = useColumns();
  useEffect(() => {
    async function loadData() {
      try {
        const [rolesRes, logsRes] = await Promise.all([
          usersApi.getRoles(),
          dashboardApi.getActivityLogs(),
        ]);

        const rolesData = rolesRes.data as Roles[]
        const rolesWithIcons = rolesData.map((role) => ({
          ...role,
          icon: roleIcons.find((r) => r.value.toLowerCase() === role.name.toLowerCase())?.icon,
        }))

        setRoles(rolesWithIcons);
        setData(logsRes.data);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Activity Logs</h2>
        <p className="text-muted-foreground">
          View your users' activity logs here.
        </p>
      </div>
      <div>
        {loading ? (
          <SkeletonTable />
        ) : (
          <DataTable columns={columns} data={data} roles={roles} />
        )}
      </div>
      <LogsDialogs />
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <LogsProvider>
      <DashboardContent />
    </LogsProvider>
  );
}

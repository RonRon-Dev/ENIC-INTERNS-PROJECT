import { Card, CardTitle } from "@/components/ui/card";
import { DataTable, columns } from "@/components/tables-data/users-column";
import type { User } from "@/components/tables-data/users-column"
import { ShieldCheck, UserCheck, UserCog, Users2 } from "lucide-react";
import { useEffect, useState } from "react"
import { UsersDialogs } from '@/components/tables-data/users-dialogs'
import { UsersProvider } from '@/components/tables-data/users-provider'

async function getData(): Promise<User[]> {
  return [
    { id: "728ed521", name: "Jane Doe", status: "pending", username: "janedoe", role: "unassigned" },
    { id: "728ed52f", name: "John Doe", status: "active", username: "johndoe", role: "superadmin" },
    { id: "728ed522", name: "John Smith", status: "inactive", username: "johnsmith", role: "admin" },
    { id: "728ed511", name: "Kate Doe", status: "deactivated", username: "katedoe", role: "unassigned" },
  ]
}

function UserManagementContent() {
  const [data, setData] = useState<User[]>([])

  useEffect(() => {
    getData().then(setData)
  }, [])

  const totalUsers = data.length
  const pendingUsers = data.filter((u) => u.status === "pending").length
  const activeUsers = data.filter((u) => u.status === "active").length
  const assignedUsers = data.filter((u) => u.role !== "unassigned").length

  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <Card className="flex p-5 transition-all duration-200 rounded-xl group relative flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Users2 className="size-4" />
            <p className="text-sm font-medium">Total Users</p>
          </div>
          <CardTitle className="text-2xl tracking-wide">{totalUsers}</CardTitle>
        </Card>
        <Card className="flex p-5 transition-all duration-200 rounded-xl group relative flex-col">
          <div className="flex items-center gap-2 mb-2">
            <UserCog className="size-4" />
            <p className="text-sm font-medium">Pending</p>
          </div>
          <CardTitle className="text-2xl tracking-wide">{pendingUsers}</CardTitle>
        </Card>
        <Card className="flex p-5 transition-all duration-200 rounded-xl group relative flex-col">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="size-4" />
            <p className="text-sm font-medium">Active Users</p>
          </div>
          <CardTitle className="text-2xl tracking-wide">{activeUsers}</CardTitle>
        </Card>
        <Card className="flex p-5 transition-all duration-200 rounded-xl group relative flex-col">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="size-4" />
            <p className="text-sm font-medium">Assigned Users</p>
          </div>
          <CardTitle className="text-2xl tracking-wide">{assignedUsers}</CardTitle>
        </Card>
      </div>

      <div>
        <DataTable columns={columns} data={data} />
      </div>
      <UsersDialogs />
    </>
  )
}

export default function UserManagementPage() {
  return (
    <UsersProvider>
      <UserManagementContent />
    </UsersProvider>
  )
}
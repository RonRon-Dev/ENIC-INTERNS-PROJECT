import { Card, CardTitle } from "@/components/ui/card";
import { DataTable, columns } from "@/components/tables-data/users-column";
import type { User } from "@/components/tables-data/users-column"
import { ShieldCheck, UserCheck, UserCog, Users2 } from "lucide-react";
import { useEffect, useState } from "react"
import { UsersDialogs } from '@/components/tables-data/users-dialogs'
import { UsersProvider } from '@/components/tables-data/users-provider'
import { UsersPrimaryButtons } from "@/components/tables-data/users-primary-buttons";
import { users } from "@/data/users"
import { Skeleton } from "@/components/ui/skeleton";

const statConfig = [
  {
    label: "Total Users",
    icon: Users2,
    getValue: (data: User[]) => data.length,
  },
  {
    label: "Pending",
    icon: UserCog,
    getValue: (data: User[]) => data.filter((u) => u.status === "pending").length,
  },
  {
    label: "Active Users",
    icon: UserCheck,
    getValue: (data: User[]) => data.filter((u) => u.status === "active").length,
  },
  {
    label: "Assigned Users",
    icon: ShieldCheck,
    getValue: (data: User[]) => data.filter((u) => u.role !== "guest").length,
  },
]

function StatCardSkeleton() {
  return (
    <Card className="flex p-5 rounded-xl flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-12" />
    </Card>
  )
}

export function SkeletonTable() {
  return (
    <div className="flex w-full flex-col gap-3 py-3">
      <div className="flex w-full gap-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="border rounded-md w-full flex flex-col gap-2 py-4">
        <div className="border-b flex gap-4 p-4 pt-0">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
        <Skeleton className="h-8 flex-1" />
        {Array.from({ length: 10 }).map((_, index) => (
          <div className="flex gap-4 px-4" key={index}>
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
            {/* <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" /> */}
          </div>
        ))}
      </div>

      <div className="flex w-full gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="ml-auto h-6 w-32" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  )
}


function UserManagementContent() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // useEffect(() => {
  //   users().then((result) => {
  //     setData(result)
  //     setLoading(false)
  //   })
  // }, [])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    users().then(setData)
  }, [])


  return (
    <>
      {/* Stat Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statConfig.map(({ label, icon: Icon, getValue }) => (
            <Card key={label} className="flex p-5 transition-all duration-200 rounded-xl flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="size-4" />
                <p className="text-sm font-medium">{label}</p>
              </div>
              <CardTitle className="text-2xl tracking-wide">{getValue(data)}</CardTitle>
            </Card>
          ))}
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2 mt-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User List</h2>
          <p className="text-muted-foreground">Manage your users and their roles here.</p>
        </div>
        <UsersPrimaryButtons />
      </div>

      {/* Table */}
      <div>
        {loading
          ? <SkeletonTable />
          : <DataTable columns={columns} data={data} />
        }
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
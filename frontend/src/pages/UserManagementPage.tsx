import { Card, CardTitle } from "@/components/ui/card";
import { DataTable, columns } from "@/components/tables-data/users-column";
import type { User } from "@/components/tables-data/users-column"
import { ShieldCheck, UserCheck, UserCog, Users2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react"
import { UsersDialogs } from '@/components/users/users-dialogs'
import { UsersProvider, useUsers } from '@/components/users/users-provider'
import { UsersPrimaryButtons } from "@/components/users/users-primary-buttons";
import { Skeleton } from "@/components/ui/skeleton";
import { usersApi } from "@/services/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type UserStats = {
  totalUsers: number
  pendingUsers: number
  activeUsers: number
  deactivatedUsers: number
  assignedUsers: number
}

type UserRequest = {
  requestId: number
  requestType: string
  requestStatus: string
  requestDate: string
  userId: number
  name: string
  userName: string
  isVerified: boolean
  isActive: boolean
  currentRole: { id: number; name: string } | null
}

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
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0, pendingUsers: 0, activeUsers: 0, deactivatedUsers: 0, assignedUsers: 0,
  })
  const [requests, setRequests] = useState<UserRequest[]>([])
  const [loading, setLoading] = useState(true)
  const { setCurrentRow, setOpen, setRefresh } = useUsers()

  const loadData = useCallback(async () => {
    try {
      const [usersRes, statsRes, requestsRes] = await Promise.all([
        usersApi.getAll(),
        usersApi.getStats(),
        usersApi.getUserRequests('Pending'),
      ])
      const mappedUsers: User[] = (usersRes.data as any[]).map((u: any) => ({
        id: String(u.id),
        name: u.name,
        username: u.userName,
        status: (!u.isVerified ? 'pending' : !u.isActive ? 'deactivated' : 'active') as User['status'],
        role: ((u.role?.name ?? 'guest').toLowerCase() === 'developer' ? 'dev' : (u.role?.name ?? 'guest').toLowerCase()) as User['role'],
      }))
      setData(mappedUsers)
      setStats(statsRes.data)
      setRequests(requestsRes.data)
    } catch (err) {
      console.error('Failed to load users data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setRefresh(loadData)
    loadData()
  }, [loadData, setRefresh])

  const statConfig = [
    { label: 'Total Users', icon: Users2, value: stats.totalUsers },
    { label: 'Pending', icon: UserCog, value: stats.pendingUsers },
    { label: 'Active Users', icon: UserCheck, value: stats.activeUsers },
    { label: 'Assigned Users', icon: ShieldCheck, value: stats.assignedUsers },
  ]

  const handleOpenRequest = (req: UserRequest) => {
    const row: User = {
      id: String(req.userId),
      name: req.name,
      username: req.userName,
      status: 'pending',
      role: ((req.currentRole?.name ?? 'guest').toLowerCase() === 'developer' ? 'dev' : (req.currentRole?.name ?? 'guest').toLowerCase()) as User['role'],
    }
    setCurrentRow(row)
    setOpen(req.requestType === 'Account Registration' ? 'approve' : 'approveReset')
  }

  return (
    <>
      {/* Stat Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statConfig.map(({ label, icon: Icon, value }) => (
            <Card key={label} className="flex p-5 transition-all duration-200 rounded-xl flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="size-4" />
                <p className="text-sm font-medium">{label}</p>
              </div>
              <CardTitle className="text-2xl tracking-wide">{value}</CardTitle>
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

      {/* User Table */}
      <div>
        {loading ? <SkeletonTable /> : <DataTable columns={columns} data={data} />}
      </div>

      {/* Pending Requests */}
      <div className="flex flex-wrap items-end justify-between gap-2 mt-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pending Requests</h2>
          <p className="text-muted-foreground">Users waiting for approval or password reset.</p>
        </div>
      </div>
      <div>
        {loading ? <SkeletonTable /> : requests.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">No pending requests.</p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Username</th>
                  <th className="px-4 py-3 text-left font-medium">Request Type</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.requestId} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 capitalize">{req.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{req.userName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{req.requestType}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(req.requestDate).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => handleOpenRequest(req)}>
                        {req.requestType === 'Account Registration' ? 'Approve' : 'Approve Reset'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
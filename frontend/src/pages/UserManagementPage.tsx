import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { DataTable, columns } from "@/components/tables-data/users-column";
import type { User } from "@/components/tables-data/users-column"
import { Icon, UserCheck, UserCog, Users, Users2 } from "lucide-react";
import { useEffect, useState } from "react"

async function getData(): Promise<User[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...
  ]
}

export default function UserManagementPage() {
  const [data, setData] = useState<User[]>([])

  useEffect(() => {
    async function fetchData() {
      const result = await getData()
      setData(result)
    }

    fetchData()
  }, [])

  
  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <Card className="flex p-5 transition-all duration-200 rounded-xl group relative flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Users2 className="size-4" />
            <p className="text-sm font-medium">Total Users</p>
          </div>
          <CardTitle className="text-2xl tracking-wide">1,234</CardTitle>
        </Card>
        <Card className="flex p-5 transition-all duration-200 rounded-xl group relative flex-col">
          <div className="flex items-center gap-2 mb-2">
            <UserCog className="size-4" />
            <p className="text-sm font-medium">Pending</p>
          </div>
          <CardTitle className="text-2xl tracking-wide">1,234</CardTitle>
        </Card>
        <Card className="flex p-5 transition-all duration-200 rounded-xl group relative flex-col">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="size-4" />
            <p className="text-sm font-medium">Active Users</p>
          </div>
          <CardTitle className="text-2xl tracking-wide">1,234</CardTitle>
        </Card>
        <Card className="flex p-5 transition-all duration-200 rounded-xl group relative flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Users2 className="size-4" />
            <p className="text-sm font-medium">Total Users</p>
          </div>
          <CardTitle className="text-2xl tracking-wide">1,234</CardTitle>
        </Card>
      </div >

      <div>
        <DataTable columns={columns} data={data} />
      </div>
    </>
  )
}

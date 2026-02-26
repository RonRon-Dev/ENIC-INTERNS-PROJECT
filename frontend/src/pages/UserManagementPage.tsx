import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Icon, Users, Users2 } from "lucide-react";

export default function UserManagementPage() {
  return (
    <>
      <title>Users</title>
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
            <Users2 className="size-4" />
            <p className="text-sm font-medium">Total Users</p>
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
        <Card className="flex p-5 transition-all duration-200 rounded-xl group relative flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Users2 className="size-4" />
            <p className="text-sm font-medium">Total Users</p>
          </div>
          <CardTitle className="text-2xl tracking-wide">1,234</CardTitle>
        </Card>
      </div >

      <div className="text-center items-center justify-center text-3xl font-black">
        {/* <DataTable columns={columns} data={data} /> */}
      </div>
      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
    </>
  )
}

import type { ActivityLog } from "./schema"
import { users } from "./users"

export const userlogs = async (): Promise<ActivityLog[]> => {
  const userList = await users();
  return [
    { id: "728ed521", user: userList[0], description: "unassigned", time: "00:00", date: "2024-01-01", type: "authentication" },
    { id: "728ed522", user: userList[1], description: "unassigned", time: "01:00", date: "2024-01-01", type: "authentication" },
    { id: "728ed52f", user: userList[2], description: "superadmin access granted", time: "02:35", date: "2024-01-01", type: "privilege" },
    { id: "728ed53f", user: userList[3], description: "admin access granted", time: "13:45", date:"2024-01-01", type: "privilege" },
    { id: "728ed53g", user: userList[4], description:"account deactivated by admia sdsa dsa das dsa dsa sa das wdq3en kldsan k asdh klsadnl dasnkl dsal kdasnkl sdanlk dsa13en" , time:"99:99" , date:"9999-99-99", type:"account management"},
  ]
}
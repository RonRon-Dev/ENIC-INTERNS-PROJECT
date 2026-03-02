

import type { User } from "./schema"

export const users: () => Promise<User[]> = async () => {
  return [
    { id: "728ed521", name: "Jane Doe", status: "pending", username: "janedoe", role: "unassigned" },
    { id: "728ed522", name: "Jake Doe", status: "pending", username: "jakedoe", role: "unassigned" },
    { id: "728ed52f", name: "John Doe", status: "active", username: "johndoe", role: "superadmin" },
    { id: "728ed522", name: "John Smith", status: "active", username: "johnsmith", role: "admin" },
    { id: "728ed511", name: "Kate Doe", status: "deactivated", username: "katedoe", role: "unassigned" },
  ]
}
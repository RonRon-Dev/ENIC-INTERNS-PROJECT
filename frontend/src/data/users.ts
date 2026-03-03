

import type { User } from "./schema"

export const users: () => Promise<User[]> = async () => {
  return [
    { id: "728ed521", name: "jane doe", status: "pending", username: "janedoe", role: "guest" },
    { id: "728ed522", name: "jake doe", status: "pending", username: "jakedoe", role: "guest" },
    { id: "728ed52f", name: "john doe", status: "active", username: "johndoe", role: "superadmin" },
    { id: "728ed522", name: "john smith", status: "active", username: "johnsmith", role: "admin" },
    { id: "728ed511", name: "kate doe", status: "deactivated", username: "katedoe", role: "guest" },
    { id: "728ed512", name: "karen smith", status: "deactivated", username: "ktsmith", role: "guest" },
  ]
}
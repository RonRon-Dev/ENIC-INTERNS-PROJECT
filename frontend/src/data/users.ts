import type { User } from "./schema"
import { usersApi } from "@/services/users"

function mapStatus(isVerified: boolean, isActive: boolean): User['status'] {
  if (!isVerified) return 'pending'
  if (!isActive) return 'deactivated'
  return 'active'
}

export const users: () => Promise<User[]> = async () => {
  const res = await usersApi.getAll()
  return (res.data as any[]).map((u): User => ({
    id: String(u.id),
    name: u.name,
    username: u.userName,
    status: mapStatus(u.isVerified, u.isActive),
    role: (u.role?.name ?? 'guest').toLowerCase() as User['role'],
  }))
}

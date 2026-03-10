import type { User } from "./schema"
import { usersApi } from "@/services/users"

function mapStatus(isVerified: boolean, isActive: boolean): User['status'] {
  if (!isVerified) return 'pending'
  if (!isActive) return 'deactivated'
  return 'active'
}

function mapRole(roleName: string): User['role'] {
  const lower = roleName.toLowerCase()
  if (lower === 'developer') return 'dev'
  return lower as User['role']
}

export const users: () => Promise<User[]> = async () => {
  const res = await usersApi.getAll()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (res.data as any[]).map((u): User => ({
    id: String(u.id),
    name: u.name,
    username: u.userName,
    status: mapStatus(u.isVerified, u.isActive),
    role: mapRole(u.role?.name ?? 'guest'),
  }))
}

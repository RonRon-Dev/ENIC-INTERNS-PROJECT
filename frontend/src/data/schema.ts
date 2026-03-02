import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('suspended'),
  z.literal('deactivated'),
  z.literal('pending'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('superadmin'),
  z.literal('admin'),
  z.literal('unassigned'),
])

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  status: userStatusSchema,
  role: userRoleSchema,
  // createdAt: z.coerce.date(),
  // updatedAt: z.coerce.date(),
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)

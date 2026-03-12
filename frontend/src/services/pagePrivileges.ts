import api from '@/services/api'

export type PagePrivilege = {
  url: string
  title: string
  allowedRoles: string[] // lowercase role names
}

export type UpdatePagePrivilegePayload = {
  url: string
  roleIds: number[]
}

export const pagePrivilegesApi = {
  getAll: async (): Promise<PagePrivilege[]> => {
    const res = await api.get<PagePrivilege[]>('/page-privileges')
    return res.data
  },

  update: async (url: string, roleIds: number[]): Promise<void> => {
    await api.put('/page-privileges', { url, roleIds })
  },
}

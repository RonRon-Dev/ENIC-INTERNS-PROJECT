import api from "@/services/api"

export const usersApi = {
  getAll: () => api.get('/users'),

  getStats: () => api.get('/users/stats'),

  getUserRequests: (status = 'Pending') =>
    api.get(`/users/user-requests?status=${encodeURIComponent(status)}`),

  getRoles: () => api.get('/users/roles'),

  createUser: (data: { name: string; userName: string; roleId: number }) =>
    api.post('/users/create-user', data),

  assignRole: (id: number, roleId: number) =>
    api.patch(`/users/assign-role/${id}`, { roleId }),

  enableUser: (id: number) => api.patch(`/users/enable-user/${id}`),

  disableUser: (id: number) => api.patch(`/users/disable-user/${id}`),

  approveRegistration: (userId: number, roleId: number) =>
    api.patch('/users/approve-registration', { userId, roleId }),

  approveResetPassword: (userName: string) =>
    api.patch('/users/approve-reset-password', { userName }),

  adminResetPassword: (userId: number) =>
    api.patch('/users/admin-reset-password', { userId }),

  unlockUser: (id: number) =>
    api.put(`/users/unlock-user/${id}`),

  createRole: (name: string) =>
    api.post('/users/roles/create', { name }),

  rejectRequest: (requestId: number, reason: string) =>
    api.put('/users/reject-request', { requestId, reason }),
}

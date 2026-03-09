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
    api.put(`/users/assign-role/${id}`, { roleId }),

  enableUser: (id: number) => api.put(`/users/enable-user/${id}`),

  disableUser: (id: number) => api.put(`/users/disable-user/${id}`),

  approveRegistration: (userId: number, roleId: number) =>
    api.put('/users/approve-registration', { userId, roleId }),

  approveResetPassword: (userName: string) =>
    api.put('/users/approve-reset-password', { userName }),
  adminResetPassword: (userId: number) =>
    api.put('/users/admin-reset-password', { userId }),
}

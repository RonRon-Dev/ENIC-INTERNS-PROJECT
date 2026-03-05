import api from "@/services/api"

export const activityLogsApi = {
  getAll: (take = 200) => api.get(`/activity-logs?take=${take}`),
};
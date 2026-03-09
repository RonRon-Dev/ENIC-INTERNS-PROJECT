import api from "@/services/api"

export const dashboardApi = {
  getActivityLogs: async () =>  
    await api.get("/activity-logs"),
};

import api from "@/services/api"

export const getActivityLogs = async () => {
  return await api.get("/activity-logs");
};

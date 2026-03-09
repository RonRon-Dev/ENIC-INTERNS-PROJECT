import * as requests from "@/validations";
import api from "@/services/api"

export const settingsApi = {
  updateAccount: async (data: requests.UpdateAccountRequest) => {
    console.log("Updating account with data:", data);
    let response = await api.patch("/settings/update-account", {
      name: data.fullname,
      userName: data.username,
      password: data.password,
    })
    return response.data
  },
};


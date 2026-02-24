import axios from "axios"
import NProgress from "@/lib/nprogress"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

// Start loader
api.interceptors.request.use((config) => {
  NProgress.start()
  return config
})

// Stop loader
api.interceptors.response.use(
  (response) => {
    NProgress.done()
    return response 
  },
  (error) => {
    NProgress.done()
    return Promise.reject(error)
  }
)

export default api
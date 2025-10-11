// src/api/axios.js
import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken, logout } from "@/utils/auth";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((cfg) => {
  const t = getAccessToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing = null;

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const { response, config } = err || {};
    const url = config?.url || "";
    const isAuthEndpoint =
      url.startsWith("/auth/login") ||
      url.startsWith("/auth/refresh") ||
      url.startsWith("/auth/logout");

    if (!isAuthEndpoint && response?.status === 401 && !config._retry) {
      config._retry = true;
      try {
        refreshing = refreshing ?? api.post("/auth/refresh");
        const { data } = await refreshing; refreshing = null;
        const access = data?.data?.access || data?.data?.accessToken;
        if (access) {
          setAccessToken(access);
          config.headers.Authorization = `Bearer ${access}`;
          return api(config);
        }
      } catch {
        refreshing = null;
        clearAccessToken();
        try { await api.post("/auth/logout"); } catch { }
        logout();
      }
    }
    return Promise.reject(err);
  }
);

export default api;

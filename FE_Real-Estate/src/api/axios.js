import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken, logout } from "@/utils/auth";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // GỬI cookie refresh_token
});

// Gắn access token vào mọi request
api.interceptors.request.use((cfg) => {
  const t = getAccessToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing = null;

// Tự refresh khi 401
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const { response, config } = err || {};
    if (response?.status === 401 && !config._retry) {
      config._retry = true;
      try {
        refreshing = refreshing ?? api.post("/auth/refresh"); // BE đọc cookie HttpOnly
        const { data } = await refreshing; refreshing = null;
        const access = data?.data?.access || data?.data?.accessToken; // hỗ trợ cả 2 dạng
        if (access) {
          setAccessToken(access);
          config.headers.Authorization = `Bearer ${access}`;
          return api(config); // retry request cũ
        }
      } catch {
        refreshing = null;
        clearAccessToken();
        try { await api.post("/auth/logout"); } catch {}
        logout();
      }
    }
    return Promise.reject(err);
  }
);

export default api;

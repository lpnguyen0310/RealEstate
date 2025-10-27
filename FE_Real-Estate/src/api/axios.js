// src/api/axios.js
import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "@/utils/auth";

const api = axios.create({ baseURL: "/api", withCredentials: true });
const refreshClient = axios.create({ baseURL: "/api", withCredentials: true });

// an toàn với Axios v1
const setAuthHeader = (cfg, token) => {
  if (!cfg.headers) cfg.headers = {};
  if (typeof cfg.headers.set === "function") cfg.headers.set("Authorization", `Bearer ${token}`);
  else cfg.headers = { ...cfg.headers, Authorization: `Bearer ${token}` };
};

// bỏ qua refresh cho các endpoint auth
const skipAuth = (url = "") => {
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  return (
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/refresh") ||
    path.startsWith("/auth/logout") ||
    path.startsWith("/auth/google")
  );
};

const isUnauth = (s) => s === 401 || s === 403;

// attach token mỗi request
api.interceptors.request.use((cfg) => {
  const t = getAccessToken();
  if (t) setAuthHeader(cfg, t);
  return cfg;
});

let isRefreshing = false;
let queued = [];
let onUnauthorized = null;
export function setOnUnauthorized(fn) { onUnauthorized = fn; }

const notifySubscribers = (newToken) => {
  queued.forEach((cb) => cb(newToken));
  queued = [];
};

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const { response, config } = err || {};
    const url = config?.url || "";

    if (response && isUnauth(response.status) && !config?._retry && !skipAuth(url)) {
      config._retry = true;

      // Nếu đang refresh thì xếp hàng đợi
      if (isRefreshing) {
        return new Promise((resolve) => {
          queued.push((newToken) => {
            const cfg = { ...config };
            if (newToken) setAuthHeader(cfg, newToken);
            if (!cfg.baseURL) cfg.baseURL = api.defaults.baseURL;
            resolve(api.request(cfg));
          });
        });
      }

      // Bắt đầu refresh
      isRefreshing = true;
      try {
        const { data } = await refreshClient.post("/auth/refresh");
        const access =
          data?.access || data?.accessToken || data?.data?.access || data?.data?.accessToken;
        if (!access) throw new Error("No access token returned");

        setAccessToken(access);
        notifySubscribers(access);

        // Retry request gốc
        const cfg = { ...config };
        setAuthHeader(cfg, access);
        if (!cfg.baseURL) cfg.baseURL = api.defaults.baseURL;
        return api.request(cfg);
      } catch (e) {
        clearAccessToken();
        notifySubscribers(null);
        try { await refreshClient.post("/auth/logout"); } catch { }
        if (onUnauthorized) onUnauthorized();
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;

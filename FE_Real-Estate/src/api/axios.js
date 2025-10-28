import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "@/utils/auth";

/* ============== AXIOS INSTANCES ============== */
const BASE_URL = import.meta.env?.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // giữ true để nếu BE dùng cookie refresh thì cookie vẫn gửi kèm
});

const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

/* ============== HELPERS ============== */
// Gắn Authorization an toàn cho nhiều version axios
const setAuthHeader = (cfg, token) => {
  if (!cfg.headers) cfg.headers = {};
  if (typeof cfg.headers.set === "function") {
    cfg.headers.set("Authorization", `Bearer ${token}`);
  } else {
    cfg.headers = { ...cfg.headers, Authorization: `Bearer ${token}` };
  }
};

// Chỉ 401 mới cần refresh (403 là thiếu quyền, refresh không giúp)
const isUnauth = (s) => s === 401;

// Chuẩn hoá URL: bỏ host & tiền tố /api để so sánh ổn định
const normalizePath = (input = "") => {
  try {
    const u = new URL(input, window.location.origin);
    return u.pathname.replace(/^\/+api(\/|$)/, "/");
  } catch {
    const p = ("/" + String(input).replace(/^https?:\/\/[^/]+/, "")).replace(/\/{2,}/g, "/");
    return p.replace(/^\/+api(\/|$)/, "/");
  }
};

// Các route auth không trigger refresh
const skipAuth = (url = "") => {
  const path = normalizePath(url);
  return (
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/refresh") ||
    path.startsWith("/auth/logout") ||
    path.startsWith("/auth/google")
  );
};

// Gọi lấy profile khi app bootstrap (đừng bật modal nếu lỗi ở đây)
const isBootstrapProfile = (url = "") => {
  const path = normalizePath(url);
  return path.startsWith("/auth/me") || path.startsWith("/user/me");
};

/* ============== GLOBAL (REFRESH QUEUE) ============== */
let isRefreshing = false;
let queued = [];
let onUnauthorized = null;

/** Cho phép app đăng ký callback khi mất phiên (sau refresh fail) */
export function setOnUnauthorized(fn) {
  onUnauthorized = fn;
}

const notifySubscribers = (newToken) => {
  queued.forEach((cb) => cb(newToken));
  queued = [];
};

/* ============== INTERCEPTORS ============== */
// Request: gắn token
api.interceptors.request.use((cfg) => {
  const t = getAccessToken();
  if (t) setAuthHeader(cfg, t);

  if (process.env.NODE_ENV !== "production") {
    const method = (cfg.method || "GET").toUpperCase();
    const hasAuthHeader = !!(cfg.headers?.Authorization || cfg.headers?.authorization);
    console.debug("[REQ]", method, cfg.url, {
      hasToken: !!t,
      authHeader: hasAuthHeader ? "set" : "missing",
    });
  }
  return cfg;
});

// Response: xử lý 401 -> refresh theo hàng đợi
api.interceptors.response.use(
  (res) => {
    if (process.env.NODE_ENV !== "production") {
      const method = (res.config?.method || "GET").toUpperCase();
      console.debug("[RES]", method, res.config?.url, res.status);
    }
    return res;
  },
  async (err) => {
    const { response, config } = err || {};
    const url = config?.url || "";
    const status = response?.status;

    if (process.env.NODE_ENV !== "production") {
      const method = (config?.method || "GET").toUpperCase();
      console.debug("[ERR]", method, url, status, {
        skip: skipAuth(url),
        _retry: !!config?._retry,
      });
    }

    // Chỉ xử lý refresh nếu: có response 401, chưa retry, và không thuộc skipAuth
    if (response && isUnauth(status) && !config?._retry && !skipAuth(url)) {
      config._retry = true;

      // Nếu đang refresh -> xếp hàng đợi
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
        // Cố gắng gửi refresh token theo nhiều format phổ biến
        const rt =
          sessionStorage.getItem("refresh_token") ||
          localStorage.getItem("refresh_token") ||
          null;

        const body = rt ? { refresh_token: rt, refreshToken: rt } : undefined;
        const headers = rt ? { "X-Refresh-Token": rt } : {};

        const { data } = await refreshClient.post("/auth/refresh", body, { headers });

        const access =
          data?.access ||
          data?.accessToken ||
          data?.data?.access ||
          data?.data?.accessToken;

        if (!access) throw new Error("No access token returned");

        // Lưu token mới
        setAccessToken(access);

        // Đánh thức các request đang chờ
        notifySubscribers(access);

        // Retry request gốc
        const cfg = { ...config };
        setAuthHeader(cfg, access);
        if (!cfg.baseURL) cfg.baseURL = api.defaults.baseURL;
        return api.request(cfg);
      } catch (e) {
        // Refresh thất bại -> clear, logout nhẹ
        clearAccessToken();
        notifySubscribers(null);
        try { await refreshClient.post("/auth/logout"); } catch { }

        // Tránh bật modal ngay khi bootstrap /auth|/user/me lỗi
        const path = normalizePath(config?.url || "");
        if (onUnauthorized && !isBootstrapProfile(path)) {
          onUnauthorized();
        }
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    // Không thuộc case refresh -> trả lỗi về
    return Promise.reject(err);
  }
);

export default api;

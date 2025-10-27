// src/utils/auth.js
const ACCESS_KEY = "access_token_v1";
let accessTokenMemory =
  sessionStorage.getItem(ACCESS_KEY) ||
  localStorage.getItem(ACCESS_KEY) ||
  null;

/** Lưu token vào cả sessionStorage & localStorage (chống mất khi F5) */
export const setAccessToken = (t) => {
  accessTokenMemory = t || null;
  if (t) {
    sessionStorage.setItem(ACCESS_KEY, t);
    localStorage.setItem(ACCESS_KEY, t);
  } else {
    sessionStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(ACCESS_KEY);
  }
};

/** Lấy token: ưu tiên RAM, fallback storage */
export const getAccessToken = () => {
  if (!accessTokenMemory) {
    accessTokenMemory =
      sessionStorage.getItem(ACCESS_KEY) ||
      localStorage.getItem(ACCESS_KEY) ||
      null;
  }
  return accessTokenMemory;
};

/** Xoá token mọi nơi (logout) */
export const clearAccessToken = () => {
  accessTokenMemory = null;
  sessionStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(ACCESS_KEY);
};

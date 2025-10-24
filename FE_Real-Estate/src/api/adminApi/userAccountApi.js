import api from "@/api/axios";

const BASE = "/user";

export const userAccountApi = {
  me: () => api.get(`${BASE}/me`).then((r) => r.data),

  // Gửi yêu cầu khóa tài khoản (nhập mật khẩu)
  requestLock: (password) =>
    api.post(`${BASE}/request-lock`, { password }).then((r) => r.data),

  // Hủy yêu cầu khóa tài khoản
  cancelLock: () =>
    api.post(`${BASE}/cancel-lock`).then((r) => r.data),

  // Gửi yêu cầu xóa tài khoản
  requestDelete: () =>
    api.post(`${BASE}/request-delete`).then((r) => r.data),

  // Hủy yêu cầu xóa tài khoản
  cancelDelete: () =>
    api.post(`${BASE}/cancel-delete`).then((r) => r.data),

  changePassword: (payload) => api.post(`${BASE}/change-password`, payload).then((r) => r.data),

};

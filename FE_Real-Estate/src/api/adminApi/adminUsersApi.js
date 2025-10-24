import api from "@/api/axios";

const BASE = "/admin/users";

export const adminUsersApi = {
  // GET danh sách + filter + paging (server-side)
  list: ({ q, role, status, page, size }) =>
    api
      .get(BASE, { params: { q, role, status, page, size } })
      .then((r) => r.data), // BE trả Page<AdminUserResponse> bọc ApiResponse? tuỳ interceptor của bạn

  // (tuỳ chọn) lấy chi tiết 1 user nếu cần
  detail: (id) => api.get(`${BASE}/${id}`).then((r) => r.data),

  // Hành động admin
  lock: (id) => api.post(`${BASE}/${id}/lock`).then((r) => r.data),
  unlock: (id) => api.post(`${BASE}/${id}/unlock`).then((r) => r.data),
  rejectDelete: (id) => api.post(`${BASE}/${id}/reject-delete`).then((r) => r.data),
  hardDelete: (id) => api.delete(`${BASE}/${id}`).then((r) => r.data),
  rejectLock : (id) => api.post(`${BASE}/${id}/reject-lock`).then((r) => r.data),

  
};

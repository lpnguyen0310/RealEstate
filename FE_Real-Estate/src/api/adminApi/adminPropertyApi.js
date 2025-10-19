import api from "../../api/axios";

const BASE = "/admin/properties";


export const adminPropertyApi = {
    // GET list + filter + paging
    list: (params) =>
        api.get(BASE, { params }).then((r) => r.data),

    // (optional) tổng hợp đếm theo trạng thái
    stats: (params) =>
        api.get(`${BASE}/stats`, { params }).then((r) => r.data),

    // GET detail 1 tin
    detail: (id) =>
        api.get(`${BASE}/${id}`).then((r) => r.data),

    approve: (id, payload) =>
        api.post(`${BASE}/${id}/approve`, payload).then((r) => r.data),

    reject: (id, reason) =>
        api.post(`${BASE}/${id}/reject`, { reason }).then((r) => r.data),

    hide: (id) =>
        api.post(`${BASE}/${id}/hide`).then((r) => r.data),

    unhide: (id) =>
        api.post(`${BASE}/${id}/unhide`).then((r) => r.data),

    hardDelete: (id) =>
        api.delete(`${BASE}/${id}`).then((r) => r.data),
};

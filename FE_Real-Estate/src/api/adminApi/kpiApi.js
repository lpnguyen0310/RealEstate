import api from "../axios";

export const kpiApi = {
  getNewUsers(range) {
    return api.get("/admin/kpi/new-users", { params: { range } });
  },
  getOrders(range, status = "PAID") {
    return api.get("/admin/kpi/orders", { params: { range, status } });
  },
  getProperties(range, status = "PUBLISHED", pendingStatus = "PENDING_REVIEW") {
    return api.get("/admin/kpi/properties", { params: { range, status, pendingStatus } });
  },

  getPendingProperties({ q = "", page = 0, size = 8 } = {}) {
    return api.get("/admin/kpi/properties/pending", { params: { q, page, size } });
  },
  getRecentOrders({ q = "", page = 0, size = 8 } = {}) {
    return api.get("/admin/kpi/orders/recent", { params: { q, page, size } });
  },

  getRecentTransactions({ status = "PAID", page = 0, size = 4 } = {}) {
    return api.get("/admin/kpi/orders/recent-transactions", {
      params: { status, page, size },
    });
  },            
};

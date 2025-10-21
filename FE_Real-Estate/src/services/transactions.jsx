// src/services/transactions.js
import api from "@/api/axios";

/**
 * Gọi API lấy danh sách lịch sử giao dịch.
 * - API: /api/transactions/history
 * - Có hỗ trợ query params: page, size
 */
export async function getTransactions({ page = 0, size = 50} = {}) {
  const res = await api.get("/transactions/history", { params: { page, size } });
  return res?.data?.data ?? { content: [], totalElements: 0 };
}

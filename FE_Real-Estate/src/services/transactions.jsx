// src/services/transactions.js
import api from "@/api/axios";

export async function getTransactions({ page = 0, size = 50} = {}) {
  const res = await api.get("/transactions/history", { params: { page, size } });
  return res?.data?.data ?? { content: [], totalElements: 0 };
}

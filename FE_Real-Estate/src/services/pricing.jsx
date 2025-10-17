// src/services/pricing.ts
import api from "@/api/axios"; // DÙNG CHUNG instance đã có interceptors

export async function fetchPricingCatalog() {
  const res = await api.get("/pricing/catalog"); // baseURL '/api' đã set trong api/axios.js
  return res?.data?.data ?? [];
}

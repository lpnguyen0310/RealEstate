// src/services/pricing.ts
import api from "@/api/axios"; // DÙNG CHUNG instance đã có interceptors

export async function fetchPricingCatalog() {
  const res = await api.get("/pricing/catalog", {
params: { active: true }
});
  return res?.data?.data ?? [];
}

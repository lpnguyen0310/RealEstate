import api from "@/api/axios";

export async function getListingTypes() {
  const res = await api.get("/listingtype");
  return res.data || [];
}
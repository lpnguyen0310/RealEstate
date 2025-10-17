const API_BASE = "https://provinces.open-api.vn/api";

async function fetchJSON(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error("Network error");
    return res.json();
}

export const mapProvince = (p) => ({ id: String(p.code), name: p.name });
export const mapDistrict = (d) => ({ id: String(d.code), name: d.name });
export const mapWard = (w) => ({ id: String(w.code), name: w.name });

export async function getProvinces(signal) {
    const data = await fetchJSON(`${API_BASE}/p/`, { signal });
    return (data ?? []).map(mapProvince);
}
export async function getDistrictsByProvinceId(provinceId, signal) {
    const data = await fetchJSON(`${API_BASE}/p/${provinceId}?depth=2`, { signal });
    return (data?.districts ?? []).map(mapDistrict);
}
export async function getWardsByDistrictId(districtId, signal) {
    const data = await fetchJSON(`${API_BASE}/d/${districtId}?depth=2`, { signal });
    return (data?.wards ?? []).map(mapWard);
}

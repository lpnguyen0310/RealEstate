import { useEffect } from "react";
import { shortUnit } from "@/utils/address";

export default function useAddressSuggestions(formData, setFormData, provinces, districts, wards) {
    useEffect(() => {
        const { houseNumber, streetName, wardId, districtId, provinceId } = formData;
        if (!provinceId || !districtId || !wardId) {
            setFormData(p => ({ ...p, addressSuggestions: [], suggestedAddress: "" }));
            return;
        }
        const getNameById = (arr, id) => (arr.find(x => String(x.id ?? x.value) === String(id))?.name ?? "");
        const prov = getNameById(provinces, provinceId);
        const dist = getNameById(districts, districtId);
        const ward = getNameById(wards, wardId);

        const long = [ward, dist, prov].filter(Boolean);
        const short = [shortUnit(ward), shortUnit(dist), shortUnit(prov)].filter(Boolean);

        const candidates = [
            `${houseNumber ? houseNumber + ", " : ""}${streetName ? streetName + ", " : ""}${long.join(", ")}`,
            `${houseNumber ? houseNumber + ", " : ""}${streetName ? streetName + ", " : ""}${short.join(", ")}`,
            `${streetName ? streetName + ", " : ""}${long.join(", ")}`,
            `${streetName ? streetName + ", " : ""}${short.join(", ")}`,
            long.join(", "),
            short.join(", "),
        ].map(s => s.replace(/\s+,/g, ",").replace(/,\s*,/g, ", ").trim())
            .filter((s, i, a) => s && a.indexOf(s) === i);

        setFormData(p => ({ ...p, addressSuggestions: candidates, suggestedAddress: candidates[0] ?? "" }));
    }, [
        formData.houseNumber, formData.streetName, formData.wardId,
        formData.districtId, formData.provinceId, provinces, districts, wards, setFormData
    ]);
}

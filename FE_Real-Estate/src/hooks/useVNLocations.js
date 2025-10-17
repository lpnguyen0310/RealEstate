import { useEffect, useRef, useState, useCallback } from "react";
import { getProvinces, getDistrictsByProvinceId, getWardsByDistrictId } from "@/api/provinces";

export default function useVNLocations(enabled = true) {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);

    const provinceCtrl = useRef(null);
    const districtCtrl = useRef(null);

    useEffect(() => {
        if (!enabled) return;
        let alive = true;
        const ctrl = new AbortController();
        getProvinces(ctrl.signal).then((p) => alive && setProvinces(p)).catch(() => { });
        return () => { alive = false; ctrl.abort?.(); };
    }, [enabled]);

    const loadDistricts = useCallback((provinceId) => {
        setDistricts([]); setWards([]);
        provinceCtrl.current?.abort?.();
        provinceCtrl.current = new AbortController();
        setLoadingDistricts(true);
        getDistrictsByProvinceId(provinceId, provinceCtrl.current.signal)
            .then(setDistricts).catch(() => { }).finally(() => setLoadingDistricts(false));
    }, []);

    const loadWards = useCallback((districtId) => {
        setWards([]);
        districtCtrl.current?.abort?.();
        districtCtrl.current = new AbortController();
        setLoadingWards(true);
        getWardsByDistrictId(districtId, districtCtrl.current.signal)
            .then(setWards).catch(() => { }).finally(() => setLoadingWards(false));
    }, []);

    return { provinces, districts, wards, loadingDistricts, loadingWards, loadDistricts, loadWards };
}

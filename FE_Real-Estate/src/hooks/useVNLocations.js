// src/hooks/useVNLocations.js
import { useEffect, useRef, useState, useCallback } from "react";
import { locationApi } from "@/api/locationApi";

export default function useVNLocations(enabled = true) {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);

    const provinceCtrl = useRef(null);
    const districtCtrl = useRef(null);

    // --- Load provinces (cities) ---
    useEffect(() => {
        if (!enabled) return;
        let alive = true;
        (async () => {
            try {
                const data = await locationApi.getCities();
                if (alive) setProvinces(data || []);
            } catch (err) {
                console.error("Failed to load provinces:", err);
            }
        })();
        return () => { alive = false; };
    }, [enabled]);

    // --- Load districts by city ---
    const loadDistricts = useCallback(async (cityId) => {
        if (!cityId) return;
        setDistricts([]);
        setWards([]);
        setLoadingDistricts(true);
        try {
            const data = await locationApi.getDistricts(cityId);
            setDistricts(data || []);
        } catch (err) {
            console.error("Failed to load districts:", err);
        } finally {
            setLoadingDistricts(false);
        }
    }, []);

    // --- Load wards by district ---
    const loadWards = useCallback(async (districtId) => {
        if (!districtId) return;
        setWards([]);
        setLoadingWards(true);
        try {
            const data = await locationApi.getWards(districtId);
            setWards(data || []);
        } catch (err) {
            console.error("Failed to load wards:", err);
        } finally {
            setLoadingWards(false);
        }
    }, []);

    // --- Reload both (for edit mode) ---
    const reloadAllByIds = useCallback(async (cityId, districtId) => {
        if (!cityId) return;
        await loadDistricts(cityId);
        if (districtId) await loadWards(districtId);
    }, [loadDistricts, loadWards]);

    return {
        provinces, districts, wards,
        loadingDistricts, loadingWards,
        loadDistricts, loadWards,
        reloadAllByIds,
    };
}

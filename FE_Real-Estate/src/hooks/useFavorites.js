import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { makeSelectIsSaved, selectSavedList, toggleSaved } from "@/store/favoriteSlice";

function timeAgo(ts) {
    if (!ts) return "";
    const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return `${s}s trước`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    return `${d} ngày trước`;
}

export default function useFavorites(id) {
    const dispatch = useDispatch();
    const selectIsSaved = useMemo(() => makeSelectIsSaved(id), [id]);
    const isSaved = useSelector(selectIsSaved);
    const list = useSelector(selectSavedList).map((x) => ({ ...x, savedAgo: timeAgo(x.savedAt) }));

    const toggle = useCallback(
        (payload) => dispatch(toggleSaved(payload)),
        [dispatch]
    );

    return { isSaved, toggle, list };
}
